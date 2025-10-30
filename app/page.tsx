"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")

    console.log("[v0] Auth check:", isAuthenticated)

    if (isAuthenticated === "true") {
      router.push("/descubrir")
    } else {
      router.push("/auth")
    }
  }, [router])

  return null
}
