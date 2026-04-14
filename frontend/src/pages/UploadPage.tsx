import { useState } from "react"
import Navbar from "@/components/Navbar"
import UploadImage from "@/components/UploadImage"
import { Footer } from "@/components/ui/footer"

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Upload Image</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Upload your image for AI-based face and body analysis.
          </p>
          <UploadImage onImageUpload={setUploadedImage} />
          {uploadedImage && <p className="mt-4 text-sm text-muted-foreground">Image uploaded successfully.</p>}
        </div>
      </main>
      <Footer />
    </div>
  )
}
