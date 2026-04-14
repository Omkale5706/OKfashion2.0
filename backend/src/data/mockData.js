// In-memory fallback data so behavior matches the original project even without Mongo.
export const users = [
  {
    id: "1",
    email: "admin@okfashion.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "Admin User",
    isAdmin: true,
  },
  {
    id: "2",
    email: "user@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "Demo User",
    isAdmin: false,
  },
  {
    id: "3",
    email: "omkale5706@gmail.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "Om kale",
    isAdmin: false,
  },
]

export const mockRecommendations = [
  {
    id: "1",
    userId: "1",
    type: "outfit",
    title: "Professional Power Look",
    description: "Perfect for important meetings and presentations",
    category: "professional",
    confidence: 0.95,
    colors: ["#2C3E50", "#FFFFFF", "#E74C3C"],
    tags: ["Professional", "Confident", "Modern"],
    image: "/professional-outfit.jpg",
    createdAt: "2025-01-15T10:00:00Z",
    liked: false,
    saved: true,
  },
  {
    id: "2",
    userId: "1",
    type: "hairstyle",
    title: "Sleek Straight Hair",
    description: "Polished look that works for any occasion",
    category: "versatile",
    confidence: 0.88,
    colors: ["#8B4513"],
    tags: ["Sleek", "Professional", "Timeless"],
    image: "/sleek-hair.jpg",
    createdAt: "2025-01-15T09:30:00Z",
    liked: true,
    saved: false,
  },
  {
    id: "3",
    userId: "1",
    type: "color",
    title: "Spring Fresh Palette",
    description: "Light, fresh colors that brighten your complexion",
    category: "seasonal",
    confidence: 0.92,
    colors: ["#FFB6C1", "#98FB98", "#87CEEB", "#F0E68C"],
    tags: ["Fresh", "Light", "Youthful"],
    image: "/spring-palette.jpg",
    createdAt: "2025-01-15T09:00:00Z",
    liked: false,
    saved: true,
  },
]

export const mockAnalysisResults = {
  faceShape: "oval",
  skinTone: "warm",
  bodyType: "pear",
  colorSeason: "autumn",
  stylePersonality: "classic",
  confidence: 0.92,
}

export function generateRecommendations(analysisData) {
  const recommendations = []

  if (analysisData.bodyType === "pear") {
    recommendations.push({
      type: "outfit",
      title: "A-Line Dress with Statement Necklace",
      description: "Perfect for your pear body shape - emphasizes your waist and balances proportions",
      category: "formal",
      confidence: 0.94,
      colors: ["#2C3E50", "#E74C3C", "#F39C12"],
      tags: ["Flattering", "Professional", "Elegant"],
      items: [
        { type: "dress", color: "#2C3E50", brand: "Example Brand" },
        { type: "necklace", color: "#F39C12", brand: "Jewelry Co" },
        { type: "heels", color: "#000000", brand: "Shoe Brand" },
      ],
    })

    recommendations.push({
      type: "outfit",
      title: "High-Waisted Jeans with Fitted Top",
      description: "Casual look that highlights your waist and creates a balanced silhouette",
      category: "casual",
      confidence: 0.89,
      colors: ["#3498DB", "#FFFFFF", "#34495E"],
      tags: ["Casual", "Comfortable", "Trendy"],
      items: [
        { type: "jeans", color: "#34495E", brand: "Denim Co" },
        { type: "top", color: "#3498DB", brand: "Fashion Label" },
        { type: "sneakers", color: "#FFFFFF", brand: "Sneaker Brand" },
      ],
    })
  }

  if (analysisData.faceShape === "oval") {
    recommendations.push({
      type: "hairstyle",
      title: "Long Layered Cut",
      description: "Your oval face shape can handle most styles - this adds movement and dimension",
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

  if (analysisData.skinTone === "warm") {
    recommendations.push({
      type: "color",
      title: "Warm Autumn Palette",
      description: "These colors complement your warm undertones perfectly",
      category: "seasonal",
      confidence: 0.96,
      colors: ["#D2691E", "#CD853F", "#DEB887", "#F4A460", "#8B4513"],
      tags: ["Warm Tones", "Earthy", "Natural"],
      bestFor: ["everyday", "professional", "evening"],
      avoidColors: ["#FF69B4", "#00FFFF", "#9370DB"],
    })
  }

  return recommendations
}
