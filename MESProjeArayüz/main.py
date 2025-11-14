import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import asyncio
import json 
app = FastAPI()
class HataModel(BaseModel):
    tip: str
    mesaj: str
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print("Yeni bir istemci bağlandı.")
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print("Bir istemci ayrıldı.")
    async def broadcast(self, json_string: str):
        for connection in self.active_connections:
            await connection.send_text(json_string)
manager = ConnectionManager()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
@app.post("/api/bildirim_gonder")
async def bildirim_gonder(hata: HataModel):
    data_to_send = {} 
    if hata.tip == 'error':
        data_to_send = {
            "type": "error_event", 
            "payload": {
                "status_title": "HATA TESPİT EDİLDİ",
                "status_message": hata.mesaj,
                "log_message": hata.mesaj
            }
        }
    elif hata.tip == 'info':
        data_to_send = {
            "type": "info_event",
            "payload": {
                "status_title": "ÜRETİM AKTİF",
                "status_message": "Sistem normal çalışıyor.",
                "log_message": hata.mesaj
            }
        }
    json_string = json.dumps(data_to_send)
    await manager.broadcast(json_string)
    return JSONResponse(content={"durum": "mesaj yayınlandı"}, status_code=200)
if __name__ == "__main__":
    print("FastAPI sunucusu http://127.0.0.1:8000 adresinde başlıyor...")
    print("WebSocket bağlantı adresi: ws://127.0.0.1:8000/ws")
    uvicorn.run(app, host="127.0.0.1", port=8000)