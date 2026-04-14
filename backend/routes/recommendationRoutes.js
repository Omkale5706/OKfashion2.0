import express from "express"
import { requireAuth } from "../middleware/auth.js"
import {
  getRecommendations,
  likeRecommendation,
  saveRecommendation,
  unlikeRecommendation,
  unsaveRecommendation,
} from "../controllers/recommendationController.js"

const router = express.Router()

router.get("/", requireAuth, getRecommendations)
router.post("/:id/like", requireAuth, likeRecommendation)
router.delete("/:id/like", requireAuth, unlikeRecommendation)
router.post("/:id/save", requireAuth, saveRecommendation)
router.delete("/:id/save", requireAuth, unsaveRecommendation)

export default router
