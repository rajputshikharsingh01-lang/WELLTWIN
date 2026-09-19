from fastapi.testclient import TestClient
from main import app
client=TestClient(app)
def test_health():
    assert client.get("/api/health").status_code==200
def test_wells():
    assert client.get("/api/wells").status_code==200
