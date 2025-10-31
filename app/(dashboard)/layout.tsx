"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/queries/auth-queries"

/**
 * Protected layout for dashboard routes
 * Checks authentication status and redirects to login if not authenticated
 * Uses useAuth hook and checks during render (no useEffect)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useAuth()

  // Wait for store to hydrate from localStorage
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-ucab-maroon border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Check authentication and redirect if not authenticated
  // This runs during render, avoiding useEffect
  if (!isAuthenticated) {
    router.replace("/auth/login")
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
