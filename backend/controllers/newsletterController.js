const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribe(req, res) {
  try {
    const { email } = req.body

    if (!email) return res.status(400).json({ message: "Email is required" })
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format" })

    await new Promise((resolve) => setTimeout(resolve, 300))
    return res.json({ success: true, message: "Successfully subscribed to newsletter!" })
  } catch (error) {
    console.error("Newsletter error:", error)
    return res.status(500).json({ message: "Failed to subscribe" })
  }
}
