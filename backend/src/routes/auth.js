import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { users } from "../data/mockData.js"
import { isMongoEnabled } from "../config/db.js"
import { User } from "../models/User.js"

const router = express.Router()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function signToken(user) {
  return jwt.sign({ userId: user.id || String(user._id), email: user.email }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  })
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    let user
    if (isMongoEnabled()) {
      user = await User.findOne({ email: email.toLowerCase() }).lean()
    }

    if (!user) {
      user = users.find((u) => u.email === email)
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = signToken(user)
    const { password: _, ...userWithoutPassword } = user
    return res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" })
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

    const normalizedEmail = email.toLowerCase()

    if (isMongoEnabled()) {
      const exists = await User.findOne({ email: normalizedEmail }).lean()
      if (exists) {
        return res.status(409).json({ message: "Email is already in use" })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const created = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        name,
        isAdmin: false,
      })

      const userObject = created.toObject()
      const token = signToken(userObject)
      const { password: _, ...userWithoutPassword } = userObject
      return res.json({ token, user: userWithoutPassword })
    }

    const existing = users.find((u) => u.email === normalizedEmail)
    if (existing) {
      return res.status(409).json({ message: "Email is already in use" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      id: Date.now().toString(),
      email: normalizedEmail,
      password: hashedPassword,
      name,
      isAdmin: false,
    }

    users.push(newUser)

    const token = signToken(newUser)
    const { password: _, ...userWithoutPassword } = newUser
    return res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error("Signup error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHeader.slice(7)
    let decoded

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    } catch {
      return res.status(401).json({ message: "Invalid token" })
    }

    let user
    if (isMongoEnabled()) {
      user = await User.findById(decoded.userId).lean()
      if (!user) {
        user = await User.findOne({ email: decoded.email }).lean()
      }
    }

    if (!user) {
      user = users.find((u) => u.id === decoded.userId || u.email === decoded.email)
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { password: _, ...userWithoutPassword } = user
    return res.json(userWithoutPassword)
  } catch (error) {
    console.error("Auth verification error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

export default router
