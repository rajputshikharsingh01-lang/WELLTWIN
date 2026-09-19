from sqlalchemy import Column,Integer,String,Float,DateTime,Boolean
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True)
    email=Column(String,unique=True,index=True)
    password_hash=Column(String)
    active=Column(Boolean,default=True)

class Well(Base):
    __tablename__="wells"
    id=Column(Integer,primary_key=True)
    well_id=Column(String,unique=True,index=True)
    status=Column(String,default="PRODUCING")
    health=Column(String,default="HEALTHY")
    production=Column(Float,default=0)
    pressure=Column(Float,default=0)
    temperature=Column(Float,default=0)
    water_cut=Column(Float,default=0)
    flow=Column(Float,default=0)
    soak_time=Column(Float,default=24)
    injection_pressure=Column(Float,default=120)
    spm=Column(Float,default=6)
    stroke_length=Column(Float,default=60)
    tank_level=Column(Float,default=70)
    vibration=Column(Float,default=2.4)
    pump_load=Column(Float,default=68)
    motor_current=Column(Float,default=42)
    latitude=Column(Float,nullable=True)
    longitude=Column(Float,nullable=True)
    updated_at=Column(DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

class Telemetry(Base):
    __tablename__="telemetry"
    id=Column(Integer,primary_key=True)
    well_id=Column(Integer,index=True)
    timestamp=Column(DateTime,index=True)
    pressure=Column(Float)
    temperature=Column(Float)
    flow=Column(Float)
    production=Column(Float)
    water_cut=Column(Float)
    tank_level=Column(Float,default=70)
    vibration=Column(Float,default=2.4)
    pump_load=Column(Float,default=68)
    motor_current=Column(Float,default=42)

class DynacardPoint(Base):
    __tablename__="dynacard_points"
    id=Column(Integer,primary_key=True)
    well_id=Column(Integer,index=True)
    position=Column(Float)
    load=Column(Float)
