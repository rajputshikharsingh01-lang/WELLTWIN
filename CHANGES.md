# WELLTWIN — Fixes & New Features (this pass)

## The root bug (why everything showed "not found" / empty)
Every frontend page picked the well identifier as `w.id ?? w.well_id`. The
database's numeric primary key (`1`..`8`) is **not** the same thing as the
`well_id` string the backend actually matches on (`BGW-01`..`BGW-08`). The
frontend was sending `1` to the API, the backend only knew `BGW-01`, so every
call to Telemetry / Simulation / Optimization / Recommendations / the live
WebSocket 404'd with `{"error":"Well not found"}`.

Fixed in two places, belt-and-braces:
- **Frontend**: every page now prefers `well_id` first (`w.well_id ?? w.id`),
  and the Wells table links use the same order.
- **Backend**: `get_well()` now also falls back to matching by numeric primary
  key or a zero-padded `BGW-XX` guess, so a stray numeric id can never 404
  again even if some other client sends one.

## Telemetry — now wired to real sensor channels
Added the 6 sensor channels you listed, end to end (model → seed → live
WebSocket → telemetry endpoint → charts):

| Field | Hardware |
|---|---|
| `pressure` | Pressure Transducer |
| `temperature` | RTD / Thermocouple |
| `flow` | Flow Meter |
| `pump_load`, `motor_current` | Pump/ESP Sensors |
| `tank_level` | Level Sensor/Transmitter |
| `vibration` | Vibration Sensor |

- 30 historical telemetry points per well (well above the 15–20 you asked for).
- The live WebSocket feed (`/ws/wells/{id}`) now streams all 6 channels every
  2s with a smooth random-walk (not just static + jitter), so it behaves like
  a real polling sensor feed.
- Telemetry page shows a live-value tile per sensor (with the hardware name)
  plus three charts: Pressure/Temperature, Flow/Pump/Motor, Tank/Vibration.

## Simulation — "Proposed Scenario" is now a real what-if tool
- **Auto-fill / coupling**: CSS fields (`soak_time` × `injection_pressure`)
  and SRP fields (`spm` × `stroke_length`) are physically coupled around the
  well's current baseline. Edit any one field and the other three refill
  automatically (`GET /wells/{id}/correlate`) — exactly "ek data fill karo,
  baaki sab de de".
- **Projection chart**: `POST /api/simulate` now also returns a 19-point
  ramp (`series`) from the current operating point to the proposed one, so
  the Proposed Scenario result has a real 15–20 point chart, not a single
  before/after number.
- **Safety verdict** is computed for the proposed point and shown with a
  probability bar and the reasons behind it.

## Optimization — genuine CSS + SRP twin-point search
`optimizer.py` previously only varied `soak_time` and `spm` while holding
`injection_pressure`/`stroke_length` fixed. It now jointly searches all four
(a real "twin point": one CSS point + one SRP point chosen together) via
`GET /wells/{id}/optimize`, and the page shows clean current→optimal cards
for the CSS point and the SRP point, expected production gain, float risk,
and the safety verdict at that optimum — instead of a raw JSON dump.

## Recommendations — safety verdict + probability
`recs()` now always includes a `SAFETY` recommendation: a verdict
(`SAFE` / `CAUTION` / `UNSAFE`), an estimated probability (%) that continuing
at the current point causes an abnormal/unsafe event, and the specific
sensor/parameter reasons behind that number (vibration, tank level, pump
load, water cut, rod stress, float risk, existing health flag). Shown as a
dedicated card with a probability bar at the top of the Recommendations page.

## Running it
```bash
# backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # (or source .venv/bin/activate on mac/linux)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# frontend (new terminal)
cd frontend
npm install
npm run dev
```
The old `welltwin.db` was deleted so the first backend start reseeds fresh
with the new sensor columns. `node_modules`/`.venv`/`.next`/`__pycache__`
were stripped from this zip (platform-specific / regenerable) — just run the
two install commands above once.
