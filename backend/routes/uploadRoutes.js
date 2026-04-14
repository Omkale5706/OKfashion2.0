import express from "express"
import multer from "multer"
import { requireAuth } from "../middleware/auth.js"
import { uploadImage } from "../controllers/uploadController.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/", requireAuth, upload.single("image"), uploadImage)
router.post("/images", requireAuth, upload.single("image"), uploadImage)

export default router
