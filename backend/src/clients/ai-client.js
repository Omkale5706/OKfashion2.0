import { logWarn } from "../infra/logger.js"

const AI_BASE_URL = process.env.AI_SERVICE_URL

export async function fetchAiAnalysis(file) {
  if (!AI_BASE_URL) return null

  try {
    const formData = new FormData()
    formData.append("image", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "upload.jpg")

    const response = await fetch(`${AI_BASE_URL}/api/ai/analyze`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      logWarn("AI service returned non-OK status", { status: response.status })
      return null
    }

    const payload = await response.json()

    return {
      faceShape: payload.face_shape,
      skinTone: payload.skin_tone,
      bodyType: payload.body_type,
      colorSeason: payload.color_season,
      stylePersonality: payload.style_personality,
      confidence: payload.confidence,
    }
  } catch (error) {
    logWarn("AI service unavailable, using fallback", { error: String(error) })
    return null
  }
}
