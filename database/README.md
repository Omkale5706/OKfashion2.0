# database

This folder represents the MongoDB layer for OKFASHION.

## Purpose

- Keep MongoDB-specific setup and operational notes.
- Provide optional local Docker setup for development.
- Document schema ownership (implemented in backend models).

## Runtime Connection

The backend connects using:

- `MONGO_URI` in `backend/.env`

Example:

`MONGO_URI=mongodb://127.0.0.1:27017/okfashion`

## Optional Local MongoDB (Docker)

Use the compose file in this folder:

`docker compose up -d`

Default local URI:

`mongodb://127.0.0.1:27017/okfashion`
