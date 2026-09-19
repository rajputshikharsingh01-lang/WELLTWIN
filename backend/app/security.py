import hashlib, jwt
from datetime import datetime,timedelta
from app.config import settings
def hash_password(p:str)->str: return hashlib.sha256(p.encode()).hexdigest()
def verify_password(p:str,h:str)->bool: return hash_password(p)==h
def make_token(email:str)->str:
    return jwt.encode({"sub":email,"exp":datetime.utcnow()+timedelta(hours=12)},settings.jwt_secret,algorithm="HS256")
