from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Well
from app.schemas import SimulationRequest
from app.physics import predict,assess_safety,simulate_series
router=APIRouter(tags=["Simulation"])
@router.post("/simulate")
def simulate(body:SimulationRequest,db:Session=Depends(get_db)):
    w=db.query(Well).filter(Well.well_id==body.well_id).first()
    if not w and body.well_id.isdigit():
        w=db.query(Well).filter(Well.id==int(body.well_id)).first()
        if not w: w=db.query(Well).filter(Well.well_id==f"BGW-{int(body.well_id):02d}").first()
    if not w: raise HTTPException(404,"Well not found")
    proposed_params={"soak_time":body.soak_time if body.soak_time is not None else w.soak_time,
                        "injection_pressure":body.injection_pressure if body.injection_pressure is not None else w.injection_pressure,
                        "spm":body.spm if body.spm is not None else w.spm,
                        "stroke_length":body.stroke_length if body.stroke_length is not None else w.stroke_length}
    current=predict(w,{"soak_time":w.soak_time,"injection_pressure":w.injection_pressure,"spm":w.spm,"stroke_length":w.stroke_length})
    proposed=predict(w,proposed_params)
    impact=round((proposed["production"]/current["production"]-1)*100,2) if current["production"] else 0
    series=simulate_series(w,proposed_params,steps=18)
    safety=assess_safety(w,proposed_params,{"vibration":w.vibration,"tank_level":w.tank_level,"pump_load":w.pump_load})
    return {"well_id":w.well_id,"current":current,"simulated":proposed,"expected_impact":{"production_percent":impact},
            "series":series,"safety":safety}
