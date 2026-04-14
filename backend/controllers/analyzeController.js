import { analyzeImageBatch, generateRecommendations } from "../services/aiService.js"
import { fetchAiAnalysis } from "../src/clients/ai-client.js"

export async function analyze(req, res) {
  try {
    const userId = req.user?.userId || "guest"
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images provided" })
    }

    let imageMeta = null
    if (req.body?.imageMeta) {
      try {
        imageMeta = JSON.parse(req.body.imageMeta)
      } catch {
        imageMeta = null
      }
    }

    let faceSignals = null
    if (req.body?.faceSignals) {
      try {
        faceSignals = JSON.parse(req.body.faceSignals)
      } catch {
        faceSignals = null
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))
    const aiAnalysis = await fetchAiAnalysis(files[0])
    const analysis = aiAnalysis || analyzeImageBatch(files, imageMeta, faceSignals)
    const recommendations = generateRecommendations(analysis)
    const analysisId = Date.now().toString()

    const analysisRecord = {
      id: analysisId,
      userId,
      timestamp: new Date().toISOString(),
      analysis,
      recommendations,
      imageCount: files.length,
    }

    void analysisRecord

    return res.json({
      success: true,
      analysisId,
      analysis,
      recommendations,
      message: "Analysis completed successfully",
    })
  } catch (error) {
    console.error("Analyze error:", error)
    return res.status(500).json({ message: "Analysis failed" })
  }
}
