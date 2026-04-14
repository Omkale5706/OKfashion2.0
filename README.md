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

## Deploy On Vercel

This repo is configured for a single Vercel project:

1. Frontend is built from `frontend` (Vite output served as static files).
2. Backend API runs as a Vercel serverless function using `api/[...all].js`.

### Vercel Project Settings

1. Framework Preset: `Other` (or leave auto-detected).
2. Root Directory: project root (`OKFASHION`).
3. Build and Output are read from `vercel.json`.

### Add Environment Variables In Vercel

1. `MONGO_URI`
2. `JWT_SECRET`
3. `CLIENT_ORIGIN` (optional)

For `CLIENT_ORIGIN`, you can provide one or multiple origins (comma-separated), for example:

`https://your-app.vercel.app,https://your-app-git-main-your-team.vercel.app`

### Deploy

1. Push to GitHub (already done).
2. Import the repository in Vercel.
3. Add environment variables.
4. Deploy.

After deploy, frontend and API are available from the same domain, and all existing frontend calls to `/api/...` keep working.

## Engineering Docs

1. `docs/ARCHITECTURE.md`
2. `docs/PRODUCTION_CHECKLIST.md`
3. `docs/MIGRATION_PLAN.md`
4. `docs/RESUME_POINTS.md`

