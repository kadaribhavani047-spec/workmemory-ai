# WorkMemory AI - Backend

Node.js + Express backend for WorkMemory AI.

## Setup

1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Open the terminal.
4. Run:

   npm install

5. Copy `.env.example` to `.env`.
6. Start:

   npm start

Expected:

   WorkMemory AI Backend running at http://localhost:5000

## Test server

Open:

   http://localhost:5000

Expected:

   {"message":"WorkMemory AI Backend is running","status":"ok"}

## Test store API

POST:

   http://localhost:5000/api/incidents

JSON body:

{
  "title": "Payment API 500 Error",
  "service": "Payment API",
  "environment": "Production",
  "description": "Payment API started returning 500 errors after deployment.",
  "severity": "High"
}

Expected response contains:

   "message": "Incident stored"

## Test investigate API

POST:

   http://localhost:5000/api/incidents/investigate

JSON body:

{
  "title": "Payment API 500 Error",
  "service": "Payment API",
  "environment": "Production",
  "description": "Payment API started returning 500 errors after deployment."
}

This endpoint is currently a mock. Real Hindsight Recall + LLM integration comes next.

## Team handoff

### Mayuri

Implement real Hindsight storage inside:

   services/hindsightService.js

Keep:

   saveToHindsight(incident)

as the exported function.

### Rithika

After Hindsight Recall works, connect the LLM analysis to:

   investigateWithMemory(incident)

### Bhavani

Frontend can call:

   POST /api/incidents
   POST /api/incidents/investigate

Local base URL:

   http://localhost:5000

If frontend and backend run on different computers, localhost will NOT refer to Sahasra's computer. Use a deployed backend URL or a shared network setup.

## Important

The current Hindsight adapter is only a test adapter. It does NOT connect to real Hindsight yet.

Do not rename `saveToHindsight` or `investigateWithMemory`.
