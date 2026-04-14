"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface BodyAnalysisProps {
  imageUrl: string | null
  analysisData: any
  isAnalyzing: boolean
  stage?: "idle" | "extracting" | "uploading" | "inferencing" | "recommending" | "done" | "failed"
  progress?: number
}

const stageLabel: Record<string, string> = {
  idle: "Waiting for upload",
  extracting: "Extracting image features",
  uploading: "Uploading image to AI service",
  inferencing: "Running AI inference",
  recommending: "Generating recommendations",
  done: "Analysis complete",
  failed: "Analysis failed",
}

export function BodyAnalysis({ imageUrl, analysisData, isAnalyzing, stage = "idle", progress = 0 }: BodyAnalysisProps) {

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">{stageLabel[stage] || "Analyzing your photo..."}</p>
          <div className="w-full max-w-xs mx-auto mt-3 h-2 bg-muted rounded">
            <div className="h-2 bg-primary rounded transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return <div className="text-center py-8 text-muted-foreground">Upload a photo to see analysis results</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Body Shape</h4>
            <Badge variant="secondary">{analysisData.bodyShape}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Face Shape</h4>
            <Badge variant="secondary">{analysisData.faceShape}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Skin Tone</h4>
            <Badge variant="secondary">{analysisData.skinTone}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Style</h4>
            <Badge variant="secondary">{analysisData.style}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Color Season</h4>
            <Badge variant="secondary">{analysisData.backendAnalysis?.colorSeason || "estimating"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Confidence</h4>
            <Badge variant="secondary">
              {typeof analysisData.backendAnalysis?.confidence === "number"
                ? `${Math.round(analysisData.backendAnalysis.confidence * 100)}%`
                : typeof analysisData.confidence === "number"
                  ? `${Math.round(analysisData.confidence * 100)}%`
                  : "estimating"}
            </Badge>
          </CardContent>
        </Card>
      </div>
      {analysisData?.realtime && (
        <p className="text-xs text-muted-foreground">
          Showing real-time preliminary analysis. Final AI result will refine these values.
        </p>
      )}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Body Measurements</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shoulders:</span>
              <span className="text-sm font-medium">{analysisData.measurements.shoulders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Waist:</span>
              <span className="text-sm font-medium">{analysisData.measurements.waist}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Hips:</span>
              <span className="text-sm font-medium">{analysisData.measurements.hips}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {imageUrl && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Analysis Preview</h4>
            <div className="relative">
              <img src={imageUrl || "/placeholder.svg"} alt="Analysis" className="w-full h-48 object-cover rounded" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              AI output is generated by backend and mapped into body shape, face shape, skin tone, and style profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

