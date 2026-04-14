import mongoose from "mongoose"

let mongoEnabled = false

export async function connectMongo(uri) {
  if (!uri) {
    console.warn("MONGO_URI not set. Running with in-memory fallback.")
    return
  }

  try {
    await mongoose.connect(uri)
    mongoEnabled = true
    console.log("MongoDB connected")
  } catch (error) {
    console.warn("MongoDB connection failed. Running with in-memory fallback.")
    console.warn(error.message)
  }
}

export function isMongoEnabled() {
  return mongoEnabled
}
