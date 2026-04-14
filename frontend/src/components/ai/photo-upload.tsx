"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FaceMesh } from "@mediapipe/face_mesh"

interface PhotoUploadProps {
  onImageUpload: (imageUrl: string, file: File) => void
  onCameraStateChange?: (active: boolean) => void
  onRealtimeAnalysis?: (payload: {
    imageUrl: string
    analysis: {
      bodyShape: string
      faceShape: string
      skinTone: string
      style: string
      confidence: number
    }
  }) => void
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const distance = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y)

const getPoint = (points: any[], idx: number) => points[idx] || { x: 0, y: 0, z: 0 }

const angleAt = (a: any, b: any, c: any) => {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag1 = Math.hypot(abx, aby)
  const mag2 = Math.hypot(cbx, cby)
  if (mag1 === 0 || mag2 === 0) return 120
  const cos = clamp(dot / (mag1 * mag2), -1, 1)
  return (Math.acos(cos) * 180) / Math.PI
}

const classifyFaceShape = (landmarks: any[]) => {
  const leftCheek = getPoint(landmarks, 234)
  const rightCheek = getPoint(landmarks, 454)
  const chin = getPoint(landmarks, 152)
  const forehead = getPoint(landmarks, 10)
  const jawLeft = getPoint(landmarks, 136)
  const jawRight = getPoint(landmarks, 365)
  const templeLeft = getPoint(landmarks, 127)
  const templeRight = getPoint(landmarks, 356)

  const faceLength = distance(chin, forehead)
  const cheekboneWidth = distance(leftCheek, rightCheek)
  const jawWidth = distance(jawLeft, jawRight)
  const foreheadWidth = distance(templeLeft, templeRight)

  const flByC = faceLength / Math.max(cheekboneWidth, 0.001)
  const jawByCheek = jawWidth / Math.max(cheekboneWidth, 0.001)
  const foreheadByCheek = foreheadWidth / Math.max(cheekboneWidth, 0.001)
  const chinAngle = angleAt(jawLeft, chin, jawRight)

  const nearlyEqualTopBottom = Math.abs(foreheadByCheek - jawByCheek) < 0.08

  if (flByC > 1.45) return "oblong"
  if (foreheadByCheek > 1.02 && jawByCheek < 0.93) return "heart"
  if (jawByCheek > 1.02 && foreheadByCheek < 0.93) return "triangle"
  if (cheekboneWidth > jawWidth * 1.06 && cheekboneWidth > foreheadWidth * 1.06 && chinAngle < 75) return "diamond"
  if (flByC < 1.18 && nearlyEqualTopBottom) return chinAngle < 78 ? "square" : "round"
  return "oval"
}

export function PhotoUpload({ onImageUpload, onRealtimeAnalysis, onCameraStateChange }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null)
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastSentAtRef = useRef(0)
  const lastFrameAtRef = useRef(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rollingRef = useRef<
    Array<{ bodyShape: string; faceShape: string; skinTone: string; style: string; confidence: number }>
  >([])

  const stopRealtimeLoop = useCallback(async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (faceMeshRef.current) {
      await faceMeshRef.current.close()
      faceMeshRef.current = null
    }
    const overlay = overlayCanvasRef.current
    if (overlay) {
      const ctx = overlay.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height)
    }
  }, [])

  const emitRealtimeAnalysis = useCallback(
    (landmarks: any[], video: HTMLVideoElement) => {
      if (!onRealtimeAnalysis) return

      const canvas = analysisCanvasRef.current
      if (!canvas) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const leftCheek = getPoint(landmarks, 234)
      const rightCheek = getPoint(landmarks, 454)
      const chin = getPoint(landmarks, 152)
      const forehead = getPoint(landmarks, 10)
      const jawLeft = getPoint(landmarks, 136)
      const jawRight = getPoint(landmarks, 365)
      const eyeLeft = getPoint(landmarks, 33)
      const eyeRight = getPoint(landmarks, 263)

      const faceWidth = distance(leftCheek, rightCheek)
      const faceHeight = distance(chin, forehead)
      const jawWidth = distance(jawLeft, jawRight)
      const widthHeightRatio = faceWidth / Math.max(faceHeight, 0.001)
      const jawFaceRatio = jawWidth / Math.max(faceWidth, 0.001)
      const faceAngle = Math.atan2(eyeRight.y - eyeLeft.y, eyeRight.x - eyeLeft.x) * (180 / Math.PI)

      const samplePoint = (p: any) => {
        const x = clamp(Math.round(p.x * canvas.width), 1, canvas.width - 2)
        const y = clamp(Math.round(p.y * canvas.height), 1, canvas.height - 2)
        const data = ctx.getImageData(x - 1, y - 1, 3, 3).data
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          n += 1
        }
        return { r: r / n, g: g / n, b: b / n }
      }

      const l = samplePoint(leftCheek)
      const r = samplePoint(rightCheek)
      const avg = { r: (l.r + r.r) / 2, g: (l.g + r.g) / 2, b: (l.b + r.b) / 2 }

      const warmScore = avg.r - avg.b + (avg.g - avg.b) * 0.3
      const skinTone = warmScore > 14 ? "warm" : warmScore < -8 ? "cool" : "neutral"

      const faceShape = classifyFaceShape(landmarks)
      const bodyShape = widthHeightRatio > 0.9 ? "pear" : widthHeightRatio < 0.72 ? "rectangle" : "hourglass"
      const style = Math.abs(faceAngle) > 8 ? "edgy" : jawFaceRatio > 0.94 ? "bold" : "classic"
      const confidence = clamp(0.7 + Math.min(0.2, Math.abs(faceAngle) / 60) + Math.min(0.06, faceWidth), 0.7, 0.96)

      const sample = { bodyShape, faceShape, skinTone, style, confidence: Number(confidence.toFixed(2)) }
      rollingRef.current.push(sample)
      if (rollingRef.current.length > 8) rollingRef.current.shift()

      const bucket = rollingRef.current
      const pickMode = (values: string[]) => {
        const count = new Map<string, number>()
        values.forEach((v) => count.set(v, (count.get(v) || 0) + 1))
        return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || values[values.length - 1]
      }
      const smoothed = {
        bodyShape: pickMode(bucket.map((x) => x.bodyShape)),
        faceShape: pickMode(bucket.map((x) => x.faceShape)),
        skinTone: pickMode(bucket.map((x) => x.skinTone)),
        style: pickMode(bucket.map((x) => x.style)),
        confidence: Number((bucket.reduce((s, x) => s + x.confidence, 0) / Math.max(bucket.length, 1)).toFixed(2)),
      }

      const imageUrl = canvas.toDataURL("image/jpeg", 0.75)
      onRealtimeAnalysis({
        imageUrl,
        analysis: smoothed,
      })
    },
    [onRealtimeAnalysis]
  )

  const startRealtimeLoop = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    await stopRealtimeLoop()
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    })
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    faceMesh.onResults((results: any) => {
      const overlay = overlayCanvasRef.current
      const v = videoRef.current
      if (!overlay || !v) return

      overlay.width = v.videoWidth
      overlay.height = v.videoHeight
      const octx = overlay.getContext("2d")
      if (!octx) return
      octx.clearRect(0, 0, overlay.width, overlay.height)

      const face = results?.multiFaceLandmarks?.[0]
      if (!face) return

      octx.fillStyle = "rgba(37,99,235,0.85)"
      for (let i = 0; i < face.length; i += 10) {
        const p = face[i]
        octx.beginPath()
        octx.arc(p.x * overlay.width, p.y * overlay.height, 1.5, 0, Math.PI * 2)
        octx.fill()
      }

      const now = performance.now()
      if (now - lastSentAtRef.current > 250) {
        lastSentAtRef.current = now
        emitRealtimeAnalysis(face, v)
      }
    })

    faceMeshRef.current = faceMesh

    const loop = async () => {
      const v = videoRef.current
      if (!v || !faceMeshRef.current || v.readyState < 2 || v.paused || v.ended) return

      const now = performance.now()
      if (now - lastFrameAtRef.current > 120) {
        lastFrameAtRef.current = now
        await faceMeshRef.current.send({ image: v })
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [emitRealtimeAnalysis, stopRealtimeLoop])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  // Handle image file selection
  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          setPreview(imageUrl)
          onImageUpload(imageUrl, file)
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageUpload]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile]
  )

  // Camera controls
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
      if (!hasMediaDevices) {
        setCameraError("Camera API is not available in this browser.")
        return
      }

      // Render camera UI first so videoRef exists before media stream attach.
      setIsCameraActive(true)

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })
      setStream(newStream)
      streamRef.current = newStream
      setPreview(null)
      rollingRef.current = []
      onCameraStateChange?.(true)

      // Wait until camera UI is mounted and video element is available.
      let video: HTMLVideoElement | null = null
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        video = videoRef.current
        if (video) break
      }

      if (!video) {
        newStream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setStream(null)
        setIsCameraActive(false)
        setCameraError("Camera element not ready. Please retry.")
        return
      }

      video.srcObject = newStream
      await video.play()
      await startRealtimeLoop()
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Unable to access camera. Please allow permission and ensure no other app is using it.")
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      setStream(null)
      setIsCameraActive(false)
    }
  }, [startRealtimeLoop])

  const stopCamera = useCallback(() => {
    stopRealtimeLoop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    onCameraStateChange?.(false)
    setIsCameraActive(false)
  }, [onCameraStateChange, stopRealtimeLoop])

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageUrl = canvas.toDataURL("image/jpeg")
        setPreview(imageUrl)
        const blob = dataURLToBlob(imageUrl)
        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
        onImageUpload(imageUrl, capturedFile)
        stopCamera()
      }
    }
  }, [onImageUpload, stopCamera])

  const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(",")
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg"
    const binary = atob(parts[1])
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
  }

  // Clear current preview
  const clearImage = useCallback(() => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (faceMeshRef.current) {
        faceMeshRef.current.close()
        faceMeshRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {cameraError && (
        <Alert variant="destructive">
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}
      {preview ? (
        <Card className="relative">
          <img
            src={preview || "/placeholder.svg"}
            alt="Uploaded preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={clearImage}>
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <>
          {isCameraActive ? (
            <Card className="relative flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-black"
                style={{ background: "black" }}
              />
              <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 w-full h-64 pointer-events-none rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
              <canvas ref={analysisCanvasRef} className="hidden" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button onClick={capturePhoto}>Capture Photo</Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Card
              className={`border-2 border-dashed p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your photo here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button onClick={startCamera} variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Use Camera
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
    </div>
  )
}

