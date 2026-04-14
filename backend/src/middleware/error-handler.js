import { logError } from "../infra/logger.js"

export function notFoundHandler(req, res) {
  return res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: "Route not found",
    requestId: req.requestId,
  })
}

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500
  const code = err.code || "INTERNAL_ERROR"

  logError("Unhandled request error", {
    requestId: req.requestId,
    code,
    status,
    method: req.method,
    path: req.originalUrl,
    error: err.message,
  })

  return res.status(status).json({
    code,
    message: status === 500 ? "Internal server error" : err.message,
    requestId: req.requestId,
  })
}
