import { Upload } from "../models/Upload.js"
import { isMongoEnabled } from "../config/db.js"

export async function uploadImage(req, res) {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: "No image uploaded" })
    }

    const imageUrl = `/uploads/${Date.now()}-${file.originalname}`

    const payload = {
      userId: req.user?.userId || "anonymous",
      imageUrl,
      createdAt: new Date(),
    }

    if (isMongoEnabled()) {
      await Upload.create(payload)
    }

    return res.json({ success: true, upload: payload })
  } catch (error) {
    console.error("Upload error:", error)
    return res.status(500).json({ message: "Upload failed" })
  }
}
