import express from "express"

const router = express.Router()
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All required fields must be filled" })
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    console.log("Contact form submission:", {
      name,
      email,
      subject,
      category,
      message,
      timestamp: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return res.json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return res.status(500).json({ message: "Failed to send message" })
  }
})

export default router
