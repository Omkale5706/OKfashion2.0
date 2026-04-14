import express from "express"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"
import { connectMongo } from "./config/db.js"
import { createApp } from "./src/app/create-app.js"
import { logError, logInfo } from "./src/infra/logger.js"

dotenv.config()

const port = Number(process.env.PORT || 5000)
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173"

await connectMongo(process.env.MONGO_URI)

const app = createApp(clientOrigin)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDist = path.resolve(__dirname, "../frontend/dist")

if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"))
  })
}

app.listen(port, () => {
  logInfo("Server running", { url: `http://localhost:${port}` })
})

process.on("unhandledRejection", (reason) => {
  logError("Unhandled rejection", { reason: String(reason) })
})

process.on("uncaughtException", (error) => {
  logError("Uncaught exception", { error: error.message })
})
