"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/queries/auth-queries"
import { useUserActivity } from "@/lib/hooks/useUserActivity"

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

  // Track user activity for last connection throughout the dashboard
  useUserActivity()

  // Redirect to login when not authenticated. Do NOT call router.replace during render.
  // Keep this hook call unconditional to preserve hook order; only perform the redirect
  // after the store has hydrated so we don't navigate prematurely.
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [hasHydrated, isAuthenticated, router])

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

  // While redirecting (not authenticated) don't render children
  if (!isAuthenticated) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
