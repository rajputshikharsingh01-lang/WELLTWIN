import asyncio,random
from datetime import datetime
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Well
from app.physics import SENSOR_MAP

# per-well running state so live values drift smoothly instead of jittering
# around the static seed value on every tick (closer to a real sensor feed)
_state={}

def _drift(key,center,lo,hi,step):
    v=_state.get(key,center)
    v+=random.uniform(-step,step)
    v=max(lo,min(hi,v))
    _state[key]=v
    return v

async def well_feed(websocket:WebSocket,well_id:str):
    await websocket.accept()
    while True:
        db=SessionLocal()
        try:
            w=db.query(Well).filter(Well.well_id==well_id).first()
            if not w and well_id.isdigit():
                w=db.query(Well).filter(Well.id==int(well_id)).first()
                if not w: w=db.query(Well).filter(Well.well_id==f"BGW-{int(well_id):02d}").first()
            if not w:
                await websocket.send_json({"error":"Well not found"}); return
            k=w.well_id
            payload={"well_id":w.well_id,"timestamp":datetime.utcnow().isoformat(),
                "pressure":round(_drift(f"{k}:pressure",w.pressure,w.pressure*.85,w.pressure*1.15,.6),2),
                "temperature":round(_drift(f"{k}:temperature",w.temperature,w.temperature*.9,w.temperature*1.1,.25),2),
                "flow":round(_drift(f"{k}:flow",w.flow,w.flow*.8,w.flow*1.2,.9),2),
                "production":round(_drift(f"{k}:production",w.production,w.production*.85,w.production*1.15,.5),2),
                "water_cut":round(_drift(f"{k}:water_cut",w.water_cut,max(0,w.water_cut-8),min(100,w.water_cut+8),.3),2),
                "tank_level":round(_drift(f"{k}:tank_level",w.tank_level,5,98,2.2),2),
                "vibration":round(_drift(f"{k}:vibration",w.vibration,max(0.2,w.vibration*.6),w.vibration*1.6,.3),2),
                "pump_load":round(_drift(f"{k}:pump_load",w.pump_load,w.pump_load*.75,min(100,w.pump_load*1.25),1.1),2),
                "motor_current":round(_drift(f"{k}:motor_current",w.motor_current,w.motor_current*.8,w.motor_current*1.2,.7),2),
                "sensors":SENSOR_MAP,
                "source":"SIMULATED"}
            await websocket.send_json(payload)
        finally: db.close()
        await asyncio.sleep(2)
