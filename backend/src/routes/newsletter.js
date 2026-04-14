import express from "express"

const router = express.Router()
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post("/", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    console.log("Newsletter subscription:", {
      email,
      timestamp: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 500))

    return res.json({
      success: true,
      message: "Successfully subscribed to newsletter!",
    })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return res.status(500).json({ message: "Failed to subscribe" })
  }
})

export default router
