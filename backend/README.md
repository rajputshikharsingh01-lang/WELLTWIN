# WELLTWIN Backend
FastAPI backend for the Baghewala Heavy Oil Field Digital Twin hackathon project.

## Run
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Open:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

Demo login:
- Email: admin@welltwin.local
- Password: welltwin

The backend seeds eight demo wells into SQLite on first start. Engineering calculations are kept in `app/physics.py`; optimization is in `app/optimizer.py`. The WebSocket feed is explicitly simulated.
