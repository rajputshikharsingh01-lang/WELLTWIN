# WELLTWIN

### Digital Twin for Well-to-Surface Optimization of CSS and SRP Operations

WELLTWIN is a digital-twin based software project designed to support monitoring, simulation, and optimization of heavy-oil well operations, with a focus on Cyclic Steam Stimulation (CSS) and Sucker Rod Pump (SRP) workflows for the Baghewala field.

## Project Structure

```text
WELLTWIN/
├── frontend/          # Next.js web dashboard
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
│
├── backend/           # Python API / simulation backend
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── .gitignore
└── README.md
```

## Technology Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**
- Python
- FastAPI / API services
- Simulation and optimization workflow

## How to Run Locally

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd WELLTWIN
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Then:

```bash
pip install -r requirements.txt
python main.py
```

If the backend README specifies a different startup command, use that command.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the local URL shown by Next.js, normally:

```text
http://localhost:3000
```

## Environment Variables

Do not commit real API keys, passwords, tokens, or other secrets.

Create local environment files from the provided examples when required:

```text
frontend/.env.local
backend/.env
```

Keep those files out of GitHub.

## Main Workflow

```text
Well / Operational Inputs
        ↓
Telemetry / Well Data
        ↓
Digital Twin
        ↓
Simulation
        ↓
Optimization
        ↓
Recommended Operating Parameters
        ↓
Dashboard / Decision Support
```

## Project Goal

The goal of WELLTWIN is to provide a software platform that can combine well information, operational parameters, simulation, and optimization into a single dashboard for better decision support.

## Hackathon Project

WELLTWIN was developed as a technology/hackathon project for demonstrating digital-twin based optimization of heavy-oil well operations.

> Note: This repository is a project prototype/demo. Production deployment should use secured environment variables, authentication, HTTPS, proper database/storage configuration, monitoring, and validated field data/models.
