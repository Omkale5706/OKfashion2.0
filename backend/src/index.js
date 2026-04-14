import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"
import { connectMongo } from "./config/db.js"
import authRoutes from "./routes/auth.js"
import fashionRoutes from "./routes/fashion.js"
import contactRoutes from "./routes/contact.js"
import newsletterRoutes from "./routes/newsletter.js"

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 5000)
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173"

await connectMongo(process.env.MONGO_URI)

app.use(cors({ origin: clientOrigin, credentials: true }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

app.use("/api/auth", authRoutes)
app.use("/api/fashion", fashionRoutes)
app.use("/api/contact", contactRoutes)
app.use("/api/newsletter", newsletterRoutes)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDist = path.resolve(__dirname, "../../client/dist")

if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"))
  })
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
