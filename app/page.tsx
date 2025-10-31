"use client"


import { useRouter } from 'next/navigation'
import { useAuthStore } from "@/lib/stores/auth-store"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const { userId, userEmail, hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for the store to hydrate from localStorage before redirecting
    if (!hasHydrated) return

    if (userId || userEmail) {
      router.replace('/descubrir')
    } else {
      router.replace('/auth')
    }
  }, [userId, userEmail, hasHydrated, router])

  return null
}
