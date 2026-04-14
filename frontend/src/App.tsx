import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import HomePage from "@/pages/HomePage"
import AboutPage from "@/pages/AboutPage"
import ServicesPage from "@/pages/ServicesPage"
import ScanStylePage from "@/pages/ScanStylePage"
import ContactPage from "@/pages/ContactPage"
import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import PrivacyPage from "@/pages/PrivacyPage"
import TermsPage from "@/pages/TermsPage"
import WishlistPage from "@/pages/WishlistPage"
import AdminPage from "@/pages/AdminPage"
import AIStylistPage from "@/pages/AIStylistPage"
import UploadPage from "@/pages/UploadPage"
import RecommendationPage from "@/pages/RecommendationPage"
import ProfilePage from "@/pages/ProfilePage"

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/scan-style" element={<ScanStylePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/ai-stylist" element={<AIStylistPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/recommendations" element={<RecommendationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}


