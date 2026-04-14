from fastapi import APIRouter, File, HTTPException, UploadFile
from app.services.inference import run_image_inference
from app.schemas.analysis import AnalysisResult

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/health")
def ai_health() -> dict:
    return {"ok": True}


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(image: UploadFile = File(...)) -> AnalysisResult:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    return run_image_inference(image_bytes=image_bytes, model_version="vision-heuristic-v2")
