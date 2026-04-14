from io import BytesIO
import colorsys

from PIL import Image, ImageFilter, ImageStat

from app.schemas.analysis import AnalysisResult


def _sample_hsv(image: Image.Image, sample_step: int = 24) -> tuple[float, float, float]:
    width, height = image.size
    pixels = image.load()

    h_sum = 0.0
    s_sum = 0.0
    v_sum = 0.0
    count = 0

    for y in range(0, height, sample_step):
        for x in range(0, width, sample_step):
            r, g, b = pixels[x, y]
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            h_sum += h
            s_sum += s
            v_sum += v
            count += 1

    if count == 0:
        return 0.0, 0.0, 0.0

    return h_sum / count, s_sum / count, v_sum / count


def _infer_skin_tone(avg_rgb: tuple[float, float, float], avg_hsv: tuple[float, float, float]) -> str:
    r, g, b = avg_rgb
    hue, sat, val = avg_hsv

    warm_bias = (r - b) + (g - b) * 0.5
    if warm_bias > 18 and hue < 0.15:
        return "warm"
    if warm_bias < -8 or hue > 0.6:
        return "cool"
    if sat < 0.20 and val > 0.55:
        return "neutral"
    return "warm" if warm_bias >= 0 else "cool"


def _infer_face_shape(w: int, h: int, edge_density: float) -> str:
    ratio = w / max(h, 1)
    if ratio >= 0.95:
        return "round"
    if ratio <= 0.72:
        return "oval"
    if edge_density > 0.18:
        return "square"
    return "oval"


def _infer_body_type(aspect_ratio: float, brightness: float) -> str:
    if aspect_ratio > 0.78:
        return "pear"
    if aspect_ratio < 0.55:
        return "rectangle"
    if brightness > 0.62:
        return "hourglass"
    return "athletic"


def _infer_color_season(skin_tone: str, brightness: float, saturation: float) -> str:
    if skin_tone == "warm" and brightness >= 0.58:
        return "spring"
    if skin_tone == "warm":
        return "autumn"
    if skin_tone == "cool" and brightness >= 0.58:
        return "summer"
    return "winter"


def _infer_style_personality(season: str, sat: float) -> str:
    if season in ("winter", "summer") and sat < 0.25:
        return "minimalist"
    if season in ("spring", "autumn") and sat > 0.35:
        return "classic"
    return "casual"


def run_image_inference(image_bytes: bytes, model_version: str) -> AnalysisResult:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize((512, 512))
    center_crop = image.crop((128, 128, 384, 384))
    avg_rgb_raw = ImageStat.Stat(center_crop).mean
    avg_rgb = (avg_rgb_raw[0], avg_rgb_raw[1], avg_rgb_raw[2])
    avg_hsv = _sample_hsv(center_crop)

    edges = center_crop.filter(ImageFilter.FIND_EDGES).convert("L")
    edge_density = ImageStat.Stat(edges).mean[0] / 255.0

    skin_tone = _infer_skin_tone(avg_rgb, avg_hsv)
    face_shape = _infer_face_shape(center_crop.shape[1], center_crop.shape[0], edge_density)
    body_type = _infer_body_type(float(image.width / image.height), avg_hsv[2])
    color_season = _infer_color_season(skin_tone, float(avg_hsv[2]), float(avg_hsv[1]))
    style_personality = _infer_style_personality(color_season, float(avg_hsv[1]))

    confidence = 0.75 + min(0.2, edge_density)

    return AnalysisResult(
        face_shape=face_shape,
        skin_tone=skin_tone,
        body_type=body_type,
        color_season=color_season,
        style_personality=style_personality,
        confidence=round(float(min(confidence, 0.95)), 2),
        model_version=model_version,
    )
