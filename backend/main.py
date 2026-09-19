from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import health, auth, wells, simulation, ws

app = FastAPI(title="WELLTWIN API", version="1.0.0", description="Baghewala Field Digital Twin API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(wells.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(ws.router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"name":"WELLTWIN","message":"Digital Twin for Well-to-Surface Optimization","docs":"/docs"}
