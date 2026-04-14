import express from "express"
import multer from "multer"
import { optionalAuth } from "../middleware/auth.js"
import { analyze } from "../controllers/analyzeController.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/", optionalAuth, upload.array("images"), analyze)

export default router
