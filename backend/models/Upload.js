import mongoose from "mongoose"

const uploadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const Upload = mongoose.models.Upload || mongoose.model("Upload", uploadSchema)
