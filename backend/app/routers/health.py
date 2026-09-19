from fastapi import APIRouter
from datetime import datetime
router=APIRouter(tags=["Health"])
@router.get("/health")
def health(): return {"status":"ok","service":"WELLTWIN API","timestamp":datetime.utcnow().isoformat()}
