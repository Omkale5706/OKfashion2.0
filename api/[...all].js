import { connectMongo } from "../backend/config/db.js"
import { createApp } from "../backend/src/app/create-app.js"

let app
let mongoInitialized = false

export default async function handler(req, res) {
  if (!mongoInitialized) {
    await connectMongo(process.env.MONGO_URI)
    mongoInitialized = true
  }

  if (!app) {
    app = createApp(process.env.CLIENT_ORIGIN)
  }

  return app(req, res)
}
