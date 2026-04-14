import { api } from "@/services/api"

export async function analyzeImages(images: File[]) {
  const formData = new FormData()
  images.forEach((image) => formData.append("images", image))
  const { data } = await api.post("/analyze", formData)
  return data
}

export async function fetchRecommendations() {
  const { data } = await api.get("/recommendations")
  return data
}
