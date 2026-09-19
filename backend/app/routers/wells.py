from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Well,Telemetry,DynacardPoint
from app.schemas import WellOut,WellParamsUpdate,SnapshotOut,RecommendationOut
from app.physics import predict,assess_safety,correlated_defaults,simulate_series,SENSOR_MAP
from app.optimizer import optimize
from datetime import datetime

router=APIRouter(tags=["Wells"])

def get_well(wid:str,db:Session):
    w=db.query(Well).filter(Well.well_id==wid).first()
    if w: return w
    # defensive fallbacks so a raw numeric id ("1") or unpadded id still resolves
    if wid.isdigit():
        w=db.query(Well).filter(Well.id==int(wid)).first()
        if w: return w
        w=db.query(Well).filter(Well.well_id==f"BGW-{int(wid):02d}").first()
        if w: return w
    raise HTTPException(404,"Well not found")

@router.get("/wells",response_model=list[WellOut])
def wells(db:Session=Depends(get_db)): return db.query(Well).order_by(Well.well_id).all()

@router.get("/wells/{well_id}",response_model=WellOut)
def well(well_id:str,db:Session=Depends(get_db)): return get_well(well_id,db)

@router.get("/wells/{well_id}/snapshot",response_model=SnapshotOut)
def snapshot(well_id:str,db:Session=Depends(get_db)):
    w=get_well(well_id,db)
    return {"well_id":w.well_id,"status":w.status,"health":w.health,"production":w.production,"pressure":w.pressure,
            "temperature":w.temperature,"water_cut":w.water_cut,"flow":w.flow,
            "tank_level":w.tank_level,"vibration":w.vibration,"pump_load":w.pump_load,"motor_current":w.motor_current,
            "css":{"soak_time":w.soak_time,"injection_pressure":w.injection_pressure},
            "srp":{"spm":w.spm,"stroke_length":w.stroke_length},"timestamp":w.updated_at or datetime.utcnow()}

@router.put("/wells/{well_id}/params",response_model=WellOut)
def update_params(well_id:str,body:WellParamsUpdate,db:Session=Depends(get_db)):
    w=get_well(well_id,db)
    for k,v in body.model_dump(exclude_none=True).items(): setattr(w,k,v)
    db.commit();db.refresh(w);return w

@router.get("/wells/{well_id}/series")
def series(well_id:str,db:Session=Depends(get_db)):
    w=get_well(well_id,db)
    rows=db.query(Telemetry).filter(Telemetry.well_id==w.id).order_by(Telemetry.timestamp).all()
    return [{"timestamp":r.timestamp.isoformat(),"production":r.production} for r in rows]

@router.get("/wells/{well_id}/telemetry")
def telemetry(well_id:str,db:Session=Depends(get_db)):
    w=get_well(well_id,db)
    rows=db.query(Telemetry).filter(Telemetry.well_id==w.id).order_by(Telemetry.timestamp).all()
    return [{"timestamp":r.timestamp.isoformat(),"pressure":r.pressure,"temperature":r.temperature,"flow":r.flow,
             "production":r.production,"water_cut":r.water_cut,"tank_level":r.tank_level,"vibration":r.vibration,
             "pump_load":r.pump_load,"motor_current":r.motor_current} for r in rows]

@router.get("/wells/{well_id}/sensors")
def sensors(well_id:str,db:Session=Depends(get_db)):
    """Which physical sensor backs each telemetry channel, for UI labelling."""
    get_well(well_id,db)
    return SENSOR_MAP

@router.get("/wells/{well_id}/correlate")
def correlate(well_id:str,field:str,value:float,db:Session=Depends(get_db)):
    """Given one CSS/SRP field the operator just edited, derive plausible
    values for the other three so the whole Proposed Scenario form fills in."""
    w=get_well(well_id,db)
    if field not in ("soak_time","injection_pressure","spm","stroke_length"):
        raise HTTPException(400,"field must be one of soak_time, injection_pressure, spm, stroke_length")
    return correlated_defaults(w,field,value)

@router.get("/wells/{well_id}/optimize")
def optimize_well(well_id:str,db:Session=Depends(get_db)):
    """Twin-point optimizer: jointly searches the CSS operating point
    (soak_time, injection_pressure) and the SRP operating point
    (spm, stroke_length) together and returns the best combined point."""
    w=get_well(well_id,db)
    return optimize(w)

@router.get("/wells/{well_id}/dynacard")
def dynacard(well_id:str,db:Session=Depends(get_db)):
    w=get_well(well_id,db)
    rows=db.query(DynacardPoint).filter(DynacardPoint.well_id==w.id).order_by(DynacardPoint.position).all()
    return [{"position":r.position,"load":r.load} for r in rows]

def recs(w):
    opt=optimize(w)
    current=predict(w,{"soak_time":w.soak_time,"injection_pressure":w.injection_pressure,"spm":w.spm,"stroke_length":w.stroke_length})
    out=[]
    if opt["parameters"]["soak_time"]!=w.soak_time:
        out.append({"id":"css-soak","type":"OPTIMIZATION","title":"CSS Soak Time","severity":"INFO","current_value":w.soak_time,"recommended_value":opt["parameters"]["soak_time"],"reason":"Optimizer-selected CSS operating point based on backend model.","expected_impact":round((opt["production"]/current["production"]-1)*100,2)})
    if opt["parameters"]["injection_pressure"]!=w.injection_pressure:
        out.append({"id":"css-injection","type":"OPTIMIZATION","title":"CSS Injection Pressure","severity":"INFO","current_value":w.injection_pressure,"recommended_value":opt["parameters"]["injection_pressure"],"reason":"Optimizer-selected CSS operating point based on backend model.","expected_impact":round((opt["production"]/current["production"]-1)*100,2)})
    if opt["parameters"]["spm"]!=w.spm:
        out.append({"id":"srp-spm","type":"PERFORMANCE","title":"SRP Speed","severity":"INFO","current_value":w.spm,"recommended_value":opt["parameters"]["spm"],"reason":"Optimizer-selected SRP operating point while penalizing mechanical risk.","expected_impact":round((opt["production"]/current["production"]-1)*100,2)})
    if opt["parameters"]["stroke_length"]!=w.stroke_length:
        out.append({"id":"srp-stroke","type":"PERFORMANCE","title":"SRP Stroke Length","severity":"INFO","current_value":w.stroke_length,"recommended_value":opt["parameters"]["stroke_length"],"reason":"Optimizer-selected SRP operating point while penalizing mechanical risk.","expected_impact":round((opt["production"]/current["production"]-1)*100,2)})
    if current["float_risk"]!="LOW":
        out.append({"id":"float-risk","type":"ROD FLOAT","title":"Rod Float Risk","severity":current["float_risk"],"current_value":current["float_risk"],"recommended_value":"LOW","reason":"Current SRP point has elevated backend-calculated float risk.","expected_impact":"Reduce mechanical risk"})
    safety=assess_safety(w,{"soak_time":w.soak_time,"injection_pressure":w.injection_pressure,"spm":w.spm,"stroke_length":w.stroke_length},
                          {"vibration":w.vibration,"tank_level":w.tank_level,"pump_load":w.pump_load})
    sev={"SAFE":"INFO","CAUTION":"WARNING","UNSAFE":"CRITICAL"}[safety["verdict"]]
    out.append({"id":"safety-verdict","type":"SAFETY","title":f"Operating Safety — {safety['verdict']}","severity":sev,
                "current_value":f"{safety['probability_percent']}% risk","recommended_value":safety["verdict"],
                "reason":" / ".join(safety["factors"]),"expected_impact":"Lower abnormal-event probability",
                "probability_percent":safety["probability_percent"],"factors":safety["factors"]})
    return out

@router.get("/wells/{well_id}/recommendations",response_model=list[RecommendationOut])
def recommendations(well_id:str,db:Session=Depends(get_db)): return recs(get_well(well_id,db))

@router.post("/wells/{well_id}/recommendations/{rec_id}/apply")
def apply_recommendation(well_id:str,rec_id:str,db:Session=Depends(get_db)):
    w=get_well(well_id,db); rs=recs(w); r=next((x for x in rs if x["id"]==rec_id),None)
    if not r: raise HTTPException(404,"Recommendation not found")
    if rec_id=="css-soak": w.soak_time=float(r["recommended_value"])
    elif rec_id=="css-injection": w.injection_pressure=float(r["recommended_value"])
    elif rec_id=="srp-spm": w.spm=float(r["recommended_value"])
    elif rec_id=="srp-stroke": w.stroke_length=float(r["recommended_value"])
    elif rec_id=="float-risk": w.spm=min(w.spm,6.0); w.stroke_length=min(w.stroke_length,60.0)
    elif rec_id=="safety-verdict": pass  # informational only, no direct parameter to apply
    db.commit();db.refresh(w)
    return {"status":"applied","well":w.well_id,"recommendation":r}
