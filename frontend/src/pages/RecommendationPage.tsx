import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import RecommendationCard from "@/components/RecommendationCard"
import Loader from "@/components/Loader"
import { Footer } from "@/components/ui/footer"
import { useFashionAPI } from "@/hooks/use-fashion-api"

export default function RecommendationPage() {
  const [items, setItems] = useState<any[]>([])
  const { loading, getRecommendations } = useFashionAPI()

  useEffect(() => {
    const run = async () => {
      const data = await getRecommendations()
      setItems(data)
    }
    void run()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Recommendations</h1>
          {loading ? (
            <Loader />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {items.map((item, idx) => (
                <RecommendationCard
                  key={item.id || idx}
                  title={item.title || "Outfit Suggestion"}
                  description={item.description || "Personalized recommendation based on your profile."}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
