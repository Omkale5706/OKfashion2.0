from fastapi import FastAPI
from app.api.routes import router as ai_router

app = FastAPI(title="OKFashion AI Service", version="1.0.0")
app.include_router(ai_router)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "ai-layer"}
