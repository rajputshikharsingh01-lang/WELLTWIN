from fastapi import APIRouter,HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest,TokenResponse
from app.security import verify_password,make_token
router=APIRouter(tags=["Authentication"])
@router.post("/login",response_model=TokenResponse)
def login(body:LoginRequest,db:Session=Depends(get_db)):
    u=db.query(User).filter(User.email==body.email).first()
    if not u or not verify_password(body.password,u.password_hash): raise HTTPException(401,"Invalid credentials")
    return {"access_token":make_token(u.email),"token_type":"bearer"}
