from fastapi import APIRouter,WebSocket,WebSocketDisconnect
from app.websocket import well_feed
router=APIRouter(tags=["WebSocket"])
@router.websocket("/ws/wells/{well_id}")
async def ws(websocket:WebSocket,well_id:str):
    try: await well_feed(websocket,well_id)
    except WebSocketDisconnect: pass
