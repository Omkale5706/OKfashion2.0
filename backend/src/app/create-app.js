import express from "express"
import cors from "cors"
import morgan from "morgan"
import authRoutes from "../../routes/authRoutes.js"
import uploadRoutes from "../../routes/uploadRoutes.js"
import analyzeRoutes from "../../routes/analyzeRoutes.js"
import recommendationRoutes from "../../routes/recommendationRoutes.js"
import contactRoutes from "../../routes/contactRoutes.js"
import newsletterRoutes from "../../routes/newsletterRoutes.js"
import { requestContext } from "../middleware/request-context.js"
import { errorHandler, notFoundHandler } from "../middleware/error-handler.js"

function getCorsOrigin(clientOrigin) {
  if (!clientOrigin) return true
  const origins = clientOrigin
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (origins.length === 0) return true
  if (origins.length === 1) return origins[0]
  return origins
}

export function createApp(clientOrigin) {
  const app = express()

  app.use(cors({ origin: getCorsOrigin(clientOrigin), credentials: true }))
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ extended: true }))
  app.use(requestContext)
  app.use(morgan("dev"))

  app.use("/api/auth", authRoutes)
  app.use("/api/upload", uploadRoutes)
  app.use("/api/analyze", analyzeRoutes)
  app.use("/api/recommendations", recommendationRoutes)

  app.use("/api/contact", contactRoutes)
  app.use("/api/newsletter", newsletterRoutes)
  app.use("/api/fashion/analyze", analyzeRoutes)
  app.use("/api/fashion/recommendations", recommendationRoutes)

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, requestId: req.requestId })
  })

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
