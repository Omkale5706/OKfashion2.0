export const mockAnalysisResults = {
  faceShape: "oval",
  skinTone: "warm",
  bodyType: "pear",
  colorSeason: "autumn",
  stylePersonality: "classic",
  confidence: 0.92,
}

function inferSkinTone(avgRgb, brightness) {
  const { r, g, b } = avgRgb || { r: 130, g: 110, b: 95 }
  const warmScore = r - b + (g - b) * 0.35
  if (warmScore > 20) return "warm"
  if (warmScore < -10) return "cool"
  if (brightness > 0.62) return "neutral"
  return "warm"
}

function inferFaceShape(width, height, contrast) {
  const ratio = width / Math.max(height, 1)
  if (ratio > 0.95) return "round"
  if (ratio < 0.72) return "oval"
  if (contrast > 0.42) return "square"
  return "oval"
}

function inferFaceShapeFromSignals(faceSignals) {
  if (!faceSignals?.detected) return null

  if (faceSignals.faceShapeGuess) {
    return faceSignals.faceShapeGuess
  }

  const flByCheek = Number(faceSignals.faceLengthCheekRatio || 1.2)
  const foreheadByCheek = Number(faceSignals.foreheadCheekRatio || 0.95)
  const jawByCheek = Number(faceSignals.jawCheekRatio || 0.95)
  const chinSharpness = Number(faceSignals.chinSharpness || 90)
  const nearlyEqualTopBottom = Math.abs(foreheadByCheek - jawByCheek) < 0.08

  if (flByCheek > 1.45) return "oblong"
  if (foreheadByCheek > 1.02 && jawByCheek < 0.93) return "heart"
  if (jawByCheek > 1.02 && foreheadByCheek < 0.93) return "triangle"
  if (flByCheek < 1.18 && nearlyEqualTopBottom) return chinSharpness < 78 ? "square" : "round"
  return "oval"
}

function inferBodyType(width, height, contrast) {
  const ratio = width / Math.max(height, 1)
  if (ratio > 0.78) return "pear"
  if (ratio < 0.56) return "rectangle"
  if (contrast > 0.5) return "athletic"
  return "hourglass"
}

function inferColorSeason(skinTone, brightness) {
  if (skinTone === "warm" && brightness > 0.58) return "spring"
  if (skinTone === "warm") return "autumn"
  if (skinTone === "cool" && brightness > 0.58) return "summer"
  return "winter"
}

function inferStylePersonality(season, contrast) {
  if (season === "winter" || season === "summer") {
    return contrast > 0.5 ? "minimalist" : "classic"
  }
  return contrast > 0.45 ? "bold" : "casual"
}

function imageBufferFingerprint(file) {
  if (!file?.buffer || file.buffer.length < 32) {
    return { mean: 127, variance: 0.08, signature: 0.5 }
  }

  const bytes = file.buffer
  const stride = Math.max(1, Math.floor(bytes.length / 2048))

  let sum = 0
  let sumSq = 0
  let xor = 0
  let count = 0

  for (let i = 0; i < bytes.length; i += stride) {
    const v = bytes[i]
    sum += v
    sumSq += v * v
    xor ^= v
    count += 1
  }

  const mean = sum / Math.max(count, 1)
  const variance = sumSq / Math.max(count, 1) - mean * mean
  const signature = ((xor + mean) % 255) / 255

  return { mean, variance: Math.max(variance, 0) / (255 * 255), signature }
}

export function analyzeImageBatch(_files, imageMeta = null, faceSignals = null) {
  const fp = imageBufferFingerprint(_files?.[0])
  if (!imageMeta) {
    const signalFaceShape = inferFaceShapeFromSignals(faceSignals)
    const signalSkinTone = faceSignals?.undertoneHint || "warm"
    return {
      ...mockAnalysisResults,
      faceShape: signalFaceShape || mockAnalysisResults.faceShape,
      skinTone: signalSkinTone,
      colorSeason: inferColorSeason(signalSkinTone, Number(faceSignals?.cheekBrightness || 0.55)),
      stylePersonality: fp.signature > 0.66 ? "bold" : fp.signature > 0.33 ? "classic" : "minimalist",
      confidence: Number((0.72 + fp.variance * 0.2).toFixed(2)),
    }
  }

  const width = Number(imageMeta.width || 512)
  const height = Number(imageMeta.height || 512)
  const brightness = Number(imageMeta.brightness || 0.55)
  const contrast = Number(imageMeta.contrast || 0.35) + fp.variance * 0.3
  const avgRgb = imageMeta.avgRgb || { r: 130, g: 110, b: 95 }

  const toneFromSignals = faceSignals?.undertoneHint
  const skinTone = toneFromSignals || inferSkinTone(avgRgb, brightness)
  const signalFaceShape = inferFaceShapeFromSignals(faceSignals)
  const faceShape = signalFaceShape || inferFaceShape(width + fp.mean * 0.2, height, contrast)
  const bodyType = inferBodyType(width, height + fp.mean * 0.15, contrast)
  const colorSeason = inferColorSeason(skinTone, Number(faceSignals?.cheekBrightness || brightness))
  const signatureBand = fp.signature > 0.7 ? "bold" : fp.signature > 0.4 ? "classic" : "minimalist"
  const styleBase = signatureBand === "classic" ? inferStylePersonality(colorSeason, contrast) : signatureBand
  const stylePersonality = Math.abs(Number(faceSignals?.faceAngle || 0)) > 8 ? "edgy" : styleBase
  const confidenceBoost = faceSignals?.detected ? 0.08 : 0
  const confidence = Math.min(0.95, 0.72 + contrast * 0.14 + fp.variance * 0.2 + confidenceBoost)

  return {
    faceShape,
    skinTone,
    bodyType,
    colorSeason,
    stylePersonality,
    confidence: Number(confidence.toFixed(2)),
  }
}

export function generateRecommendations(analysisData) {
  const recommendations = []

  const outfitByBodyType = {
    pear: {
      title: "A-Line Dress with Statement Necklace",
      description: "Perfect for your pear body shape - emphasizes your waist and balances proportions",
      category: "formal",
      colors: ["#2C3E50", "#E74C3C", "#F39C12"],
      tags: ["Flattering", "Professional", "Elegant"],
      items: [
        { type: "dress", color: "#2C3E50", brand: "Example Brand" },
        { type: "necklace", color: "#F39C12", brand: "Jewelry Co" },
        { type: "heels", color: "#000000", brand: "Shoe Brand" },
      ],
    },
    rectangle: {
      title: "Structured Blazer with Belted Trousers",
      description: "Creates definition and a balanced silhouette for rectangle body type",
      category: "professional",
      colors: ["#1F2937", "#D4A373", "#F9FAFB"],
      tags: ["Defined Waist", "Structured", "Modern"],
      items: [
        { type: "blazer", color: "#1F2937", brand: "Tailor Studio" },
        { type: "trousers", color: "#F9FAFB", brand: "Urban Form" },
        { type: "belt", color: "#D4A373", brand: "Leather Co" },
      ],
    },
    hourglass: {
      title: "Wrap Dress with Heeled Sandals",
      description: "Highlights natural balance and waist definition for hourglass body shape",
      category: "evening",
      colors: ["#7C3AED", "#111827", "#F3F4F6"],
      tags: ["Balanced", "Elegant", "Curated"],
      items: [
        { type: "wrap dress", color: "#7C3AED", brand: "Silhouette House" },
        { type: "sandals", color: "#111827", brand: "Heel Lab" },
      ],
    },
    athletic: {
      title: "Layered Smart-Casual Set",
      description: "Soft layering adds dimension and polish to athletic silhouettes",
      category: "smart-casual",
      colors: ["#0EA5E9", "#E5E7EB", "#374151"],
      tags: ["Layered", "Balanced", "Versatile"],
      items: [
        { type: "knit top", color: "#0EA5E9", brand: "Motion Wear" },
        { type: "overshirt", color: "#E5E7EB", brand: "Layer Co" },
        { type: "pants", color: "#374151", brand: "Urban Fit" },
      ],
    },
  }

  const selectedOutfit = outfitByBodyType[analysisData.bodyType] || outfitByBodyType.hourglass
  recommendations.push({
    type: "outfit",
    title: selectedOutfit.title,
    description: selectedOutfit.description,
    category: selectedOutfit.category,
    confidence: 0.91,
    colors: selectedOutfit.colors,
    tags: selectedOutfit.tags,
    items: selectedOutfit.items,
  })

  recommendations.push({
    type: "outfit",
    title: analysisData.stylePersonality === "minimalist" ? "Monochrome Capsule Outfit" : "Color-Balanced Street Ensemble",
    description:
      analysisData.stylePersonality === "minimalist"
        ? "Clean lines and neutral tones aligned to your style personality"
        : "Expressive layers and contrast calibrated to your style profile",
    category: "daily",
    confidence: 0.87,
    colors: analysisData.stylePersonality === "minimalist" ? ["#111827", "#6B7280", "#F9FAFB"] : ["#2563EB", "#F59E0B", "#1F2937"],
    tags: ["Personalized", "AI Curated", analysisData.stylePersonality],
    items: [
      { type: "top", color: "#2563EB", brand: "Style Core" },
      { type: "bottom", color: "#1F2937", brand: "Style Core" },
      { type: "shoes", color: "#F9FAFB", brand: "Style Core" },
    ],
  })

  if (analysisData.faceShape === "oval" || analysisData.faceShape === "round" || analysisData.faceShape === "square") {
    recommendations.push({
      type: "hairstyle",
      title: analysisData.faceShape === "round" ? "Layered Side-Part Cut" : analysisData.faceShape === "square" ? "Textured Soft Layers" : "Long Layered Cut",
      description:
        analysisData.faceShape === "round"
          ? "Adds vertical structure and balances facial proportions"
          : analysisData.faceShape === "square"
            ? "Softens jawline definition with natural movement"
            : "Your oval face shape can handle most styles - this adds movement and dimension",
      category: "long",
      confidence: 0.91,
      colors: ["#8B4513", "#D2691E"],
      tags: ["Versatile", "Low Maintenance", "Modern"],
      maintenance: "medium",
      suitableFor: ["professional", "casual", "formal"],
    })

    recommendations.push({
      type: "hairstyle",
      title: "Textured Bob",
      description: "A chic, modern cut that frames your face beautifully",
      category: "short",
      confidence: 0.87,
      colors: ["#654321", "#A0522D"],
      tags: ["Chic", "Modern", "Easy Styling"],
      maintenance: "low",
      suitableFor: ["professional", "casual"],
    })
  }

  if (analysisData.skinTone === "warm" || analysisData.skinTone === "cool" || analysisData.skinTone === "neutral") {
    recommendations.push({
      type: "color",
      title:
        analysisData.skinTone === "cool"
          ? "Cool Seasonal Palette"
          : analysisData.skinTone === "neutral"
            ? "Balanced Neutral Palette"
            : "Warm Autumn Palette",
      description:
        analysisData.skinTone === "cool"
          ? "These tones harmonize with your cool undertones"
          : analysisData.skinTone === "neutral"
            ? "A balanced palette that works across warm and cool accents"
            : "These colors complement your warm undertones perfectly",
      category: "seasonal",
      confidence: 0.96,
      colors:
        analysisData.skinTone === "cool"
          ? ["#4C6EF5", "#7C83FD", "#CBD5E1", "#0F172A", "#C084FC"]
          : analysisData.skinTone === "neutral"
            ? ["#64748B", "#94A3B8", "#E2E8F0", "#334155", "#8B5CF6"]
            : ["#D2691E", "#CD853F", "#DEB887", "#F4A460", "#8B4513"],
      tags: ["Warm Tones", "Earthy", "Natural"],
      bestFor: ["everyday", "professional", "evening"],
      avoidColors: analysisData.skinTone === "cool" ? ["#FF8C00", "#D97706", "#A16207"] : ["#FF69B4", "#00FFFF", "#9370DB"],
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "outfit",
      title: "Adaptive Smart Outfit",
      description: "General-purpose recommendation generated from your uploaded image features",
      category: "adaptive",
      confidence: 0.82,
      colors: ["#334155", "#E2E8F0", "#2563EB"],
      tags: ["Adaptive", "Fallback", "Universal"],
      items: [{ type: "set", color: "#334155", brand: "OK Fashion" }],
    })
  }

  return recommendations
}
