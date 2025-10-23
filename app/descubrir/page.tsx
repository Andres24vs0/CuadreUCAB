"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ProfileCard, type Profile } from "@/components/profile-card"
import { MatchModal } from "@/components/match-modal"
import { mockProfiles, currentUserPhoto } from "@/lib/mock-profiles"

export default function DescubrirPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedProfile, setDisplayedProfile] = useState<Profile>(profiles[0])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (isAuthenticated !== "true") {
      router.push("/auth")
    }
  }, [router])

  const currentProfile = profiles[currentIndex]

  const handleLike = () => {
    setSwipeDirection("right")
    setIsTransitioning(true)

    setTimeout(() => {
      if (currentProfile?.hasLikedYou) {
        setMatchedProfile(currentProfile)
        setShowMatchModal(true)
      }
      moveToNextProfile()
      setSwipeDirection(null)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 500)
  }

  const handleDislike = () => {
    setSwipeDirection("left")
    setIsTransitioning(true)

    setTimeout(() => {
      moveToNextProfile()
      setSwipeDirection(null)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 500)
  }

  const moveToNextProfile = () => {
    const nextIndex = currentIndex < profiles.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(nextIndex)
    setDisplayedProfile(profiles[nextIndex])
  }

  const handleCloseMatchModal = () => {
    setShowMatchModal(false)
    setMatchedProfile(null)
  }

  if (!currentProfile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold">{"No hay más perfiles"}</h2>
            <p className="text-muted-foreground">Vuelve más tarde para ver nuevos perfiles</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center p-6 py-8">
        <div className={`transition-opacity duration-200 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
          <ProfileCard
            profile={displayedProfile}
            onLike={handleLike}
            onDislike={handleDislike}
            swipeDirection={swipeDirection}
          />
        </div>
      </main>

      <MatchModal
        isOpen={showMatchModal}
        onClose={handleCloseMatchModal}
        matchedProfile={matchedProfile}
        currentUserPhoto={currentUserPhoto}
      />
    </div>
  )
}
