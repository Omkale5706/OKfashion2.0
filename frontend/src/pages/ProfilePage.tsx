import { Navigation } from "@/components/ui/navigation"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { Footer } from "@/components/ui/footer"
import { useAuth } from "@/contexts/auth-context"

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Profile</h1>
          {user ? <ProfileSection user={user} /> : <p className="text-muted-foreground">Please login to view profile.</p>}
        </div>
      </main>
      <Footer />
    </div>
  )
}
