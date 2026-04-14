import jwt from "jsonwebtoken"

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next()
  }

  const token = authHeader.slice(7)
  if (!token || token === "null" || token === "undefined") {
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    req.user = decoded
  } catch {
    // Ignore invalid token for optional-auth flows.
  }

  return next()
}
