from math import sin,pi

SENSOR_MAP={
    "pressure":{"label":"Wellhead Pressure","sensor":"Pressure Transducer","unit":"psi"},
    "temperature":{"label":"Temperature","sensor":"RTD / Thermocouple","unit":"°F"},
    "flow":{"label":"Flow Rate","sensor":"Flow Meter","unit":"bbl/d"},
    "pump_load":{"label":"Pump Load","sensor":"Pump/ESP Sensor","unit":"%"},
    "motor_current":{"label":"Motor Current","sensor":"Pump/ESP Sensor","unit":"A"},
    "tank_level":{"label":"Tank Level","sensor":"Level Sensor/Transmitter","unit":"%"},
    "vibration":{"label":"Vibration","sensor":"Vibration Sensor","unit":"mm/s"},
}

def predict(well, params):
    soak=float(params.get("soak_time",well.soak_time))
    inj=float(params.get("injection_pressure",well.injection_pressure))
    spm=float(params.get("spm",well.spm))
    stroke=float(params.get("stroke_length",well.stroke_length))
    css_factor=1+0.003*(soak-24)+0.002*(inj-120)
    srp_factor=1+0.012*(spm-6)+0.0015*(stroke-60)
    production=max(0.0,well.production*css_factor*srp_factor)
    pressure=max(0.0,well.pressure+0.08*(inj-well.injection_pressure))
    water=max(0.0,min(100.0,well.water_cut+0.15*max(0,spm-6)))
    rod_stress=max(0.0,0.35*spm*stroke)
    float_risk="HIGH" if spm>10 or stroke>90 else ("MEDIUM" if spm>8 or stroke>75 else "LOW")
    return {"production":round(production,2),"pressure":round(pressure,2),"water_cut":round(water,2),
            "rod_stress":round(rod_stress,2),"float_risk":float_risk,
            "parameters":{"soak_time":soak,"injection_pressure":inj,"spm":spm,"stroke_length":stroke}}

def correlated_defaults(well, changed_field, value):
    """CSS (soak_time <-> injection_pressure) and SRP (spm <-> stroke_length) are
    physically coupled. Moving one field re-derives the other three around the
    well's current baseline so the operator only has to fill in one number."""
    value=float(value)
    css_k=max(1.0,well.soak_time)*max(1.0,well.injection_pressure)   # constant "CSS energy input"
    srp_k=max(0.1,well.spm)*max(1.0,well.stroke_length)              # constant pump displacement (spm*stroke)
    out={"soak_time":well.soak_time,"injection_pressure":well.injection_pressure,
         "spm":well.spm,"stroke_length":well.stroke_length}
    if changed_field=="soak_time":
        out["soak_time"]=value
        out["injection_pressure"]=round(css_k/max(1.0,value),2)
    elif changed_field=="injection_pressure":
        out["injection_pressure"]=value
        out["soak_time"]=round(css_k/max(1.0,value),2)
    elif changed_field=="spm":
        out["spm"]=value
        out["stroke_length"]=round(srp_k/max(0.1,value),2)
    elif changed_field=="stroke_length":
        out["stroke_length"]=value
        out["spm"]=round(srp_k/max(1.0,value),2)
    return out

def simulate_series(well, params, steps=18, hours_step=4):
    """Ramp production/pressure/water_cut from the well's current operating point
    toward the proposed point over `steps` future intervals, so the UI has a
    15-20 point projection to chart instead of a single before/after snapshot."""
    from datetime import datetime,timedelta
    target=predict(well,params)
    cur={"production":well.production,"pressure":well.pressure,"water_cut":well.water_cut}
    series=[]
    now=datetime.utcnow()
    for i in range(steps+1):
        f=i/steps
        series.append({
            "timestamp":(now+timedelta(hours=i*hours_step)).isoformat(),
            "step":i,
            "production":round(cur["production"]+(target["production"]-cur["production"])*f,2),
            "pressure":round(cur["pressure"]+(target["pressure"]-cur["pressure"])*f,2),
            "water_cut":round(cur["water_cut"]+(target["water_cut"]-cur["water_cut"])*f,2),
        })
    return series

def assess_safety(well, params=None, live=None):
    """Heuristic safety scoring from current sensor readings + operating point.
    Returns a verdict (SAFE / CAUTION / UNSAFE) with an estimated probability
    that continued operation at this point causes an abnormal / unsafe event."""
    p=predict(well,params or {"soak_time":well.soak_time,"injection_pressure":well.injection_pressure,
                               "spm":well.spm,"stroke_length":well.stroke_length})
    vib=float((live or {}).get("vibration",well.vibration))
    tank=float((live or {}).get("tank_level",well.tank_level))
    pump_load=float((live or {}).get("pump_load",well.pump_load))
    risk=0.0
    factors=[]
    rf={"LOW":0,"MEDIUM":35,"HIGH":65}[p["float_risk"]]
    if rf: risk+=rf; factors.append(f"Rod/pump float risk is {p['float_risk']} at this SRP point (+{rf}%)")
    if vib>4.5: risk+=25; factors.append(f"Vibration {vib:.1f} mm/s exceeds normal band (>4.5) (+25%)")
    elif vib>3.2: risk+=10; factors.append(f"Vibration {vib:.1f} mm/s is elevated (+10%)")
    if tank>92: risk+=15; factors.append(f"Tank level {tank:.0f}% near overflow threshold (+15%)")
    elif tank<10: risk+=10; factors.append(f"Tank level {tank:.0f}% critically low, run-dry risk (+10%)")
    if pump_load>90: risk+=15; factors.append(f"Pump/ESP load {pump_load:.0f}% near rated limit (+15%)")
    if p["water_cut"]>60: risk+=10; factors.append(f"Water cut {p['water_cut']:.1f}% is high, scaling/corrosion risk (+10%)")
    if p["rod_stress"]>28: risk+=10; factors.append(f"Rod stress index {p['rod_stress']:.1f} elevated (+10%)")
    if well.health=="CRITICAL": risk+=20; factors.append("Well already flagged CRITICAL by backend health (+20%)")
    elif well.health=="WARNING": risk+=10; factors.append("Well already flagged WARNING by backend health (+10%)")
    prob=round(min(97.0,risk),1)
    verdict="SAFE" if prob<20 else ("CAUTION" if prob<50 else "UNSAFE")
    if not factors: factors.append("All monitored sensors within normal operating bands")
    return {"verdict":verdict,"probability_percent":prob,"factors":factors,"evaluated":p}

def dynacard_points(well):
    pts=[]
    for i in range(61):
        x=i/60*100
        y=well.spm*10 + 20*sin(2*pi*i/60) + 8*sin(4*pi*i/60)
        pts.append({"position":round(x,2),"load":round(y,2)})
    return pts
