import mongoose from "mongoose"

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    bodyType: { type: String },
    skinTone: { type: String },
    suggestedOutfits: [{ type: String }],
  },
  { timestamps: true },
)

export const Recommendation =
  mongoose.models.Recommendation || mongoose.model("Recommendation", recommendationSchema)
