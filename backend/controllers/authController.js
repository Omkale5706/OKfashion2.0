import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User } from "../models/User.js"
import { isMongoEnabled } from "../config/db.js"
import { users } from "../services/mockStore.js"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function signToken(user) {
  return jwt.sign({ userId: user.id || String(user._id), email: user.email }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  })
}

export async function register(req, res) {
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
      if (exists) return res.status(409).json({ message: "Email is already in use" })

      const hashedPassword = await bcrypt.hash(password, 10)
      const created = await User.create({ name, email: normalizedEmail, password: hashedPassword, isAdmin: false })
      const userObject = created.toObject()
      const token = signToken(userObject)
      const { password: _, ...safeUser } = userObject
      return res.json({ token, user: safeUser })
    }

    const exists = users.find((u) => u.email === normalizedEmail)
    if (exists) return res.status(409).json({ message: "Email is already in use" })

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = { id: Date.now().toString(), name, email: normalizedEmail, password: hashedPassword, isAdmin: false }
    users.push(newUser)

    const token = signToken(newUser)
    const { password: _, ...safeUser } = newUser
    return res.json({ token, user: safeUser })
  } catch (error) {
    console.error("Register error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    let user
    if (isMongoEnabled()) {
      user = await User.findOne({ email: email.toLowerCase() }).lean()
    }
    if (!user) user = users.find((u) => u.email === email)

    if (!user) return res.status(401).json({ message: "Invalid credentials" })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: "Invalid credentials" })

    const token = signToken(user)
    const { password: _, ...safeUser } = user
    return res.json({ token, user: safeUser })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export async function me(req, res) {
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
      if (!user) user = await User.findOne({ email: decoded.email }).lean()
    }
    if (!user) user = users.find((u) => u.id === decoded.userId || u.email === decoded.email)

    if (!user) return res.status(404).json({ message: "User not found" })

    const { password: _, ...safeUser } = user
    return res.json(safeUser)
  } catch (error) {
    console.error("Me error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
