import { Recommendation } from "../models/Recommendation.js"
import { isMongoEnabled } from "../config/db.js"
import { mockRecommendations } from "../services/mockStore.js"

export async function getRecommendations(req, res) {
  try {
    const userId = req.user.userId
    const { type, category } = req.query
    const limit = Number.parseInt(req.query.limit || "10", 10)

    if (isMongoEnabled()) {
      const docs = await Recommendation.find({ userId }).lean()

      let filtered = docs
      if (type) filtered = filtered.filter((rec) => rec.type === type)
      if (category) filtered = filtered.filter((rec) => rec.category === category)
      filtered = filtered.slice(0, Number.isNaN(limit) ? 10 : limit)

      return res.json({ recommendations: filtered, total: filtered.length })
    }

    let recommendations = mockRecommendations.filter((rec) => rec.userId === userId)

    if (type) {
      recommendations = recommendations.filter((rec) => rec.type === type)
    }

    if (category) {
      recommendations = recommendations.filter((rec) => rec.category === category)
    }

    recommendations = recommendations.slice(0, Number.isNaN(limit) ? 10 : limit)

    return res.json({ recommendations, total: recommendations.length })
  } catch (error) {
    console.error("Recommendations error:", error)
    return res.status(500).json({ message: "Failed to fetch recommendations" })
  }
}

export function likeRecommendation(req, res) {
  return res.json({ success: true, message: "Recommendation liked successfully", recommendationId: req.params.id })
}

export function unlikeRecommendation(req, res) {
  return res.json({ success: true, message: "Recommendation unliked successfully", recommendationId: req.params.id })
}

export function saveRecommendation(req, res) {
  return res.json({ success: true, message: "Recommendation saved successfully", recommendationId: req.params.id })
}

export function unsaveRecommendation(req, res) {
  return res.json({ success: true, message: "Recommendation unsaved successfully", recommendationId: req.params.id })
}
