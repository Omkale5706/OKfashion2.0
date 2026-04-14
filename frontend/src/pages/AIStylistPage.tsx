"use client"

import { useState, useCallback } from "react"
import { Camera, Sparkles, User, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/ui/navigation"
import { Footer } from "@/components/ui/footer"
import { PhotoUpload } from "@/components/ai/photo-upload"
import { BodyAnalysis } from "@/components/ai/body-analysis"
import { OutfitRecommendations } from "@/components/ai/outfit-recommendations"
import { RecommendationEngine } from "@/components/ai/recommendation-engine"
import { TrendAnalyzer } from "@/components/ai/trend-analyzer"
import { useFashionAPI } from "@/hooks/use-fashion-api"
import { FaceMesh } from "@mediapipe/face_mesh"

type ImageMeta = {
  width: number
  height: number
  avgRgb: {
    r: number
    g: number
    b: number
  }
  brightness: number
  contrast: number
}

type AnalysisStage = "idle" | "extracting" | "uploading" | "inferencing" | "recommending" | "done" | "failed"

type FaceSignals = {
  detected: boolean
  widthHeightRatio?: number
  jawForeheadRatio?: number
  cheekJawRatio?: number
  faceLengthCheekRatio?: number
  foreheadCheekRatio?: number
  jawCheekRatio?: number
  chinSharpness?: number
  faceAngle?: number
  faceAreaRatio?: number
  undertoneHint?: "warm" | "cool" | "neutral"
  cheekBrightness?: number
  faceShapeGuess?: string
}

const quickInferFromMeta = (meta: ImageMeta) => {
  const warmScore = meta.avgRgb.r - meta.avgRgb.b + (meta.avgRgb.g - meta.avgRgb.b) * 0.35
  const skinTone = warmScore > 20 ? "warm" : warmScore < -10 ? "cool" : "neutral"

  const ratio = meta.width / Math.max(meta.height, 1)
  const faceShape = ratio > 0.95 ? "round" : ratio < 0.72 ? "oval" : "square"
  const bodyShape = ratio > 0.78 ? "pear" : ratio < 0.56 ? "rectangle" : "hourglass"
  const season = skinTone === "warm" ? (meta.brightness > 0.58 ? "spring" : "autumn") : meta.brightness > 0.58 ? "summer" : "winter"
  const style = season === "winter" ? "minimalist" : "casual"

  return {
    bodyShape,
    faceShape,
    skinTone,
    style,
    confidence: 0.65,
  }
}

const extractImageMeta = (imageUrl: string): Promise<ImageMeta> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Unable to read image pixels"))
        return
      }

      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

      let rSum = 0
      let gSum = 0
      let bSum = 0
      let lumSum = 0
      let lumSqSum = 0
      let count = 0

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        rSum += r
        gSum += g
        bSum += b
        lumSum += lum
        lumSqSum += lum * lum
        count += 1
      }

      const meanLum = lumSum / Math.max(count, 1)
      const variance = lumSqSum / Math.max(count, 1) - meanLum * meanLum

      resolve({
        width: img.width,
        height: img.height,
        avgRgb: {
          r: Math.round(rSum / Math.max(count, 1)),
          g: Math.round(gSum / Math.max(count, 1)),
          b: Math.round(bSum / Math.max(count, 1)),
        },
        brightness: Number((meanLum / 255).toFixed(3)),
        contrast: Number((Math.sqrt(Math.max(variance, 0)) / 128).toFixed(3)),
      })
    }
    img.onerror = () => reject(new Error("Image metadata extraction failed"))
    img.src = imageUrl
  })
}

const getPoint = (points: any[], index: number) => points[index] || { x: 0, y: 0, z: 0 }

const distance = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y)

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

const classifyFaceShapeSignals = (values: {
  faceLengthByCheek: number
  foreheadByCheek: number
  jawByCheek: number
  chinAngle: number
}) => {
  const { faceLengthByCheek, foreheadByCheek, jawByCheek, chinAngle } = values
  const nearlyEqualTopBottom = Math.abs(foreheadByCheek - jawByCheek) < 0.08

  if (faceLengthByCheek > 1.45) return "oblong"
  if (foreheadByCheek > 1.02 && jawByCheek < 0.93) return "heart"
  if (jawByCheek > 1.02 && foreheadByCheek < 0.93) return "triangle"
  if (faceLengthByCheek < 1.18 && nearlyEqualTopBottom) return chinAngle < 78 ? "square" : "round"
  return "oval"
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

const extractFaceSignals = async (imageUrl: string): Promise<FaceSignals> => {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = imageUrl
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  })
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })

  const result = await new Promise<any>((resolve) => {
    faceMesh.onResults((results: any) => resolve(results))
    faceMesh.send({ image: img })
  })
  await faceMesh.close()

  const landmarks = result?.multiFaceLandmarks?.[0]
  if (!landmarks || landmarks.length === 0) {
    return { detected: false }
  }

  const leftCheek = getPoint(landmarks, 234)
  const rightCheek = getPoint(landmarks, 454)
  const chin = getPoint(landmarks, 152)
  const forehead = getPoint(landmarks, 10)
  const jawLeft = getPoint(landmarks, 136)
  const jawRight = getPoint(landmarks, 365)
  const templeLeft = getPoint(landmarks, 127)
  const templeRight = getPoint(landmarks, 356)
  const eyeLeft = getPoint(landmarks, 33)
  const eyeRight = getPoint(landmarks, 263)

  const faceWidth = distance(leftCheek, rightCheek)
  const faceHeight = distance(chin, forehead)
  const jawWidth = distance(jawLeft, jawRight)
  const foreheadWidth = distance(templeLeft, templeRight)
  const chinAngle = angleAt(jawLeft, chin, jawRight)
  const faceLengthByCheek = faceHeight / Math.max(faceWidth, 0.001)
  const foreheadByCheek = foreheadWidth / Math.max(faceWidth, 0.001)
  const jawByCheek = jawWidth / Math.max(faceWidth, 0.001)
  const faceShapeGuess = classifyFaceShapeSignals({ faceLengthByCheek, foreheadByCheek, jawByCheek, chinAngle })
  const faceAngle = Math.atan2(eyeRight.y - eyeLeft.y, eyeRight.x - eyeLeft.x) * (180 / Math.PI)

  const xs = landmarks.map((p: any) => p.x)
  const ys = landmarks.map((p: any) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const faceAreaRatio = clamp((maxX - minX) * (maxY - minY), 0, 1)

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")
  let undertoneHint: "warm" | "cool" | "neutral" = "neutral"
  let cheekBrightness = 0.5

  if (ctx) {
    ctx.drawImage(img, 0, 0)
    const sample = (point: any) => {
      const x = clamp(Math.round(point.x * img.width), 1, img.width - 2)
      const y = clamp(Math.round(point.y * img.height), 1, img.height - 2)
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

    const l = sample(leftCheek)
    const r = sample(rightCheek)
    const avg = { r: (l.r + r.r) / 2, g: (l.g + r.g) / 2, b: (l.b + r.b) / 2 }
    const warmScore = avg.r - avg.b + (avg.g - avg.b) * 0.3
    undertoneHint = warmScore > 14 ? "warm" : warmScore < -8 ? "cool" : "neutral"
    cheekBrightness = clamp((0.299 * avg.r + 0.587 * avg.g + 0.114 * avg.b) / 255, 0, 1)
  }

  return {
    detected: true,
    widthHeightRatio: Number((faceWidth / Math.max(faceHeight, 0.001)).toFixed(3)),
    jawForeheadRatio: Number((jawWidth / Math.max(foreheadWidth, 0.001)).toFixed(3)),
    cheekJawRatio: Number((faceWidth / Math.max(jawWidth, 0.001)).toFixed(3)),
    faceLengthCheekRatio: Number(faceLengthByCheek.toFixed(3)),
    foreheadCheekRatio: Number(foreheadByCheek.toFixed(3)),
    jawCheekRatio: Number(jawByCheek.toFixed(3)),
    chinSharpness: Number(chinAngle.toFixed(2)),
    faceAngle: Number(faceAngle.toFixed(2)),
    faceAreaRatio: Number(faceAreaRatio.toFixed(3)),
    undertoneHint,
    cheekBrightness: Number(cheekBrightness.toFixed(3)),
    faceShapeGuess,
  }
}

export default function AIStylistPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle")
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const { analyzeImages } = useFashionAPI()

  const handleCameraStateChange = useCallback((active: boolean) => {
    if (active) {
      setAnalysisError(null)
      setAnalysisData(null)
      setAnalysisStage("inferencing")
      setAnalysisProgress(15)
    } else if (!active && analysisStage === "inferencing") {
      setAnalysisStage("idle")
      setAnalysisProgress(0)
    }
  }, [analysisStage])

  const handleRealtimeAnalysis = useCallback(
    (payload: {
      imageUrl: string
      analysis: {
        bodyShape: string
        faceShape: string
        skinTone: string
        style: string
        confidence: number
      }
    }) => {
      setUploadedImage(payload.imageUrl)
      setAnalysisError(null)
      setAnalysisStage("inferencing")
      setAnalysisProgress(65)
      setAnalysisData({
        ...payload.analysis,
        measurements: {
          shoulders: "live estimate",
          waist: "live estimate",
          hips: "live estimate",
        },
        realtime: true,
        liveMode: true,
      })
    },
    []
  )

  const handleImageUpload = useCallback(async (imageUrl: string, file: File) => {
    setUploadedImage(imageUrl)
    setIsAnalyzing(true)
    setAnalysisData(null)
    setAnalysisError(null)
    setAnalysisStage("extracting")
    setAnalysisProgress(10)

    let imageMeta: ImageMeta | undefined
    let faceSignals: FaceSignals | undefined
    try {
      imageMeta = await extractImageMeta(imageUrl)
      faceSignals = await extractFaceSignals(imageUrl)
      const quick = quickInferFromMeta(imageMeta)
      setAnalysisData({
        ...quick,
        faceShape: faceSignals?.faceShapeGuess || quick.faceShape,
        measurements: {
          shoulders: "estimating...",
          waist: "estimating...",
          hips: "estimating...",
        },
        realtime: true,
      })
      setAnalysisProgress(28)
    } catch (error) {
      console.warn("Metadata extraction failed, continuing with file-only analysis", error)
    }

    setAnalysisStage("uploading")
    setAnalysisProgress(42)
    const stageTimer = window.setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 88) return prev
        return prev + 4
      })
    }, 400)

    const result = await analyzeImages([file], imageMeta, faceSignals)
    window.clearInterval(stageTimer)

    if (!result) {
      setAnalysisError("AI analysis failed. Please try another image.")
      setAnalysisStage("failed")
      setAnalysisProgress(0)
      setIsAnalyzing(false)
      return
    }

    setAnalysisStage("inferencing")
    setAnalysisProgress(92)

    setAnalysisData({
      bodyShape: result.analysis.bodyType,
      faceShape: result.analysis.faceShape,
      skinTone: result.analysis.skinTone,
      style: result.analysis.stylePersonality,
      measurements: {
        shoulders: "estimated",
        waist: "estimated",
        hips: "estimated",
      },
      backendAnalysis: result.analysis,
      recommendations: result.recommendations,
      realtime: false,
      liveMode: false,
    })
    setAnalysisStage("recommending")
    setAnalysisProgress(97)

    setAnalysisStage("done")
    setAnalysisProgress(100)
    setIsAnalyzing(false)
  }, [analyzeImages])

  const userProfile = {
    bodyShape: analysisData?.bodyShape || "hourglass",
    faceShape: analysisData?.faceShape || "oval",
    skinTone: analysisData?.skinTone || "warm",
    style: analysisData?.style || "casual-chic",
    preferences: ["floral prints", "neutral colors", "comfortable fits"],
    previousLikes: [1, 3, 5, 7, 9, 12, 15],
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">AI Fashion Stylist</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your photo and get personalized outfit recommendations powered by AI
          </p>
        </div>

        <Tabs defaultValue="photo-analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo-analysis" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fashion Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo-analysis" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Upload Your Photo
                  </CardTitle>
                  <CardDescription>Take a photo or upload an image for AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoUpload
                    onImageUpload={handleImageUpload}
                    onRealtimeAnalysis={handleRealtimeAnalysis}
                    onCameraStateChange={handleCameraStateChange}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Analysis
                  </CardTitle>
                  <CardDescription>Body shape, face features, and style analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisError && <div className="text-center text-destructive">{analysisError}</div>}
                  {uploadedImage ? (
                    <BodyAnalysis
                      imageUrl={uploadedImage}
                      analysisData={analysisData}
                      isAnalyzing={isAnalyzing}
                      stage={analysisStage}
                      progress={analysisProgress}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Upload a photo to see AI analysis results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {analysisData && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personalized Recommendations
                    </CardTitle>
                    <CardDescription>Outfits curated just for you based on AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OutfitRecommendations analysisData={analysisData} userImage={uploadedImage} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationEngine userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="trends">
            <TrendAnalyzer />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}


