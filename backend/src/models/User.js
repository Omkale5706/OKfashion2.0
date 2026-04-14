import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const User = mongoose.models.User || mongoose.model("User", userSchema)
