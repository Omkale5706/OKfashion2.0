# OKFASHION

Complete project arranged in the required format:

-> frontend
-> backend
-> database
-> ai-layer

## Folder Structure

```
OKFASHION/
├── frontend/                          # React + Vite UI
├── backend/                           # Express APIs and business logic
├── database/                          # MongoDB setup notes and scripts
├── ai-layer/                          # AI integration layer
├── package.json                       # Root scripts for full stack run
└── README.md
```

## Run From Main Folder

1. `npm run install:all`
2. `npm run dev`

Optional AI service run:

1. `cd ai-layer`
2. `pip install -r requirements.txt`
3. `python -m uvicorn app.main:app --reload --port 8001`

## Architecture Flow

1. Frontend calls backend API endpoints.
2. Backend handles auth, analysis orchestration, and recommendation APIs.
3. Backend persists data in MongoDB when `MONGO_URI` is configured.
4. AI layer is integrated through backend services/API contracts.

## Environment Variables

Set in `backend/.env`:

1. `MONGO_URI` for MongoDB connection.
2. `JWT_SECRET` for auth tokens.
3. `CLIENT_ORIGIN` for CORS (optional, default supports local frontend).

Without `MONGO_URI`, backend runs with in-memory fallback.

## Engineering Docs

1. `docs/ARCHITECTURE.md`
2. `docs/PRODUCTION_CHECKLIST.md`
3. `docs/MIGRATION_PLAN.md`
4. `docs/RESUME_POINTS.md`

