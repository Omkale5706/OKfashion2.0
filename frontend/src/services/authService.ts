import { api } from "@/services/api"

export async function register(payload: { email: string; password: string; name: string }) {
  const { data } = await api.post("/auth/register", payload)
  return data
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me")
  return data
}
