from datetime import datetime,timedelta
from math import sin,pi
from app.database import SessionLocal
from app.models import User,Well,Telemetry,DynacardPoint
from app.security import hash_password
from app.physics import dynacard_points

def seed():
    db=SessionLocal()
    try:
        if not db.query(User).filter_by(email="admin@welltwin.local").first():
            db.add(User(email="admin@welltwin.local",password_hash=hash_password("welltwin")))
        if db.query(Well).count()==0:
            wells=[]
            for i in range(8):
                vibration_base=2.2+i*0.35 if i<6 else (4.6 if i==6 else 6.4)
                w=Well(well_id=f"BGW-{i+1:02d}",status="PRODUCING" if i<7 else "OFFLINE",
                    health="HEALTHY" if i<6 else ("WARNING" if i==6 else "CRITICAL"),
                    production=38+i*2.7,pressure=112+i*5.5,temperature=68+i*.8,
                    water_cut=18+i*1.7,flow=42+i*2,soak_time=24+i%3*4,
                    injection_pressure=120+i*2,spm=5.5+i*.25,stroke_length=58+i,
                    tank_level=55+i*3.5,vibration=vibration_base,pump_load=60+i*3.2,motor_current=38+i*1.8,
                    latitude=27.0+i*.01,longitude=71.0+i*.012)
                db.add(w);wells.append(w)
            db.flush()
            for w in wells:
                for j in range(30):
                    t=datetime.utcnow()-timedelta(hours=(29-j)*3)
                    tank_wave=50+35*abs(sin(2*pi*j/12))  # tank fills then gets trucked out, sawtooth-ish cycle
                    vib_noise=w.vibration+(0.6*sin(j*0.9))+((j%9==0)*(1.8 if w.health!="HEALTHY" else 0.3))
                    db.add(Telemetry(well_id=w.id,timestamp=t,pressure=w.pressure+(j-15)*.25,
                        temperature=w.temperature+(j%5)*.2,flow=w.flow+(j%4)*.5,
                        production=w.production+(j-15)*.12,water_cut=w.water_cut,
                        tank_level=round(min(98,max(5,tank_wave)),2),
                        vibration=round(max(0.4,vib_noise),2),
                        pump_load=round(w.pump_load+(j%6)*1.1,2),
                        motor_current=round(w.motor_current+(j%5)*.6,2)))
                for p in dynacard_points(w):
                    db.add(DynacardPoint(well_id=w.id,position=p["position"],load=p["load"]))
        db.commit()
    finally: db.close()
