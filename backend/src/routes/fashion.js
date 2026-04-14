import express from "express"
import multer from "multer"
import { requireAuth } from "../middleware/auth.js"
import { generateRecommendations, mockAnalysisResults, mockRecommendations } from "../data/mockData.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/analyze", requireAuth, upload.array("images"), async (req, res) => {
  try {
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images provided" })
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const analysisResults = mockAnalysisResults
    const recommendations = generateRecommendations(analysisResults)

    const analysisRecord = {
      id: Date.now().toString(),
      userId: req.user.userId,
      timestamp: new Date().toISOString(),
      analysis: analysisResults,
      recommendations,
      imageCount: files.length,
    }

    return res.json({
      success: true,
      analysisId: analysisRecord.id,
      analysis: analysisResults,
      recommendations,
      message: "Analysis completed successfully",
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return res.status(500).json({ message: "Analysis failed" })
  }
})

router.get("/recommendations", requireAuth, (req, res) => {
  try {
    const { type, category, limit = "10" } = req.query
    const parsedLimit = Number.parseInt(String(limit), 10)

    let recommendations = mockRecommendations.filter((rec) => rec.userId === req.user.userId)

    if (type) {
      recommendations = recommendations.filter((rec) => rec.type === type)
    }

    if (category) {
      recommendations = recommendations.filter((rec) => rec.category === category)
    }

    recommendations = recommendations.slice(0, parsedLimit)

    return res.json({ recommendations, total: recommendations.length })
  } catch (error) {
    console.error("Recommendations fetch error:", error)
    return res.status(500).json({ message: "Failed to fetch recommendations" })
  }
})

router.post("/recommendations/:id/like", requireAuth, (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Recommendation liked successfully",
      recommendationId: req.params.id,
    })
  } catch (error) {
    console.error("Like error:", error)
    return res.status(500).json({ message: "Failed to like recommendation" })
  }
})

router.delete("/recommendations/:id/like", requireAuth, (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Recommendation unliked successfully",
      recommendationId: req.params.id,
    })
  } catch (error) {
    console.error("Unlike error:", error)
    return res.status(500).json({ message: "Failed to unlike recommendation" })
  }
})

router.post("/recommendations/:id/save", requireAuth, (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Recommendation saved successfully",
      recommendationId: req.params.id,
    })
  } catch (error) {
    console.error("Save error:", error)
    return res.status(500).json({ message: "Failed to save recommendation" })
  }
})

router.delete("/recommendations/:id/save", requireAuth, (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Recommendation unsaved successfully",
      recommendationId: req.params.id,
    })
  } catch (error) {
    console.error("Unsave error:", error)
    return res.status(500).json({ message: "Failed to unsave recommendation" })
  }
})

export default router
