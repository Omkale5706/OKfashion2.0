from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    image_url: str | None = Field(default=None, description="Optional uploaded image URL")


class AnalysisResult(BaseModel):
    face_shape: str
    skin_tone: str
    body_type: str
    color_season: str
    style_personality: str
    confidence: float
    model_version: str
