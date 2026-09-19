from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Any

class LoginRequest(BaseModel):
    email:str
    password:str
class TokenResponse(BaseModel):
    access_token:str
    token_type:str="bearer"

class WellOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id:int
    well_id:str
    status:str
    health:str
    production:float
    pressure:float
    temperature:float
    water_cut:float
    flow:float
    soak_time:float
    injection_pressure:float
    spm:float
    stroke_length:float
    tank_level:Optional[float]=None
    vibration:Optional[float]=None
    pump_load:Optional[float]=None
    motor_current:Optional[float]=None
    latitude:Optional[float]=None
    longitude:Optional[float]=None
    updated_at:Optional[datetime]=None

class WellParamsUpdate(BaseModel):
    soak_time:Optional[float]=Field(None,ge=0)
    injection_pressure:Optional[float]=Field(None,ge=0)
    spm:Optional[float]=Field(None,ge=0)
    stroke_length:Optional[float]=Field(None,ge=0)

class SnapshotOut(BaseModel):
    well_id:str
    status:str
    health:str
    production:float
    pressure:float
    temperature:float
    water_cut:float
    flow:float
    tank_level:Optional[float]=None
    vibration:Optional[float]=None
    pump_load:Optional[float]=None
    motor_current:Optional[float]=None
    css:dict[str,float]
    srp:dict[str,float]
    timestamp:datetime

class SimulationRequest(BaseModel):
    well_id:str
    soak_time:Optional[float]=None
    injection_pressure:Optional[float]=None
    spm:Optional[float]=None
    stroke_length:Optional[float]=None

class RecommendationOut(BaseModel):
    id:str
    type:str
    title:str
    severity:str
    current_value:Any
    recommended_value:Any
    reason:str
    expected_impact:Any
    probability_percent:Optional[float]=None
    factors:Optional[list[str]]=None
