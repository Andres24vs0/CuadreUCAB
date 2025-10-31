"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ProfileCard, type Profile } from "@/components/profile-card"
import { MatchModal } from "@/components/match-modal"
import { useAuth } from "@/lib/queries/auth-queries"
import { useDiscoverableProfiles, useCreateSwipe } from "@/lib/queries/user-queries"
import { useUserProfile } from "@/lib/queries/user-queries"

export default function DescubrirPage() {
  const { userId } = useAuth()
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useDiscoverableProfiles(userId)
  const { data: currentUserProfile } = useUserProfile(userId)
  const createSwipe = useCreateSwipe()


  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedProfile, setDisplayedProfile] = useState<Profile | null>(null)

  // Update displayed profile when profiles change
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setDisplayedProfile(profiles[currentIndex])
    } else if (profiles.length === 0) {
      setDisplayedProfile(null)
    }
  }, [profiles, currentIndex])

  const currentProfile = profiles[currentIndex]
  const currentUserPhoto = currentUserProfile?.fotos?.[0] || ""

  const handleLike = async () => {
    if (!currentProfile || !userId) return

    setSwipeDirection("right")
    setIsTransitioning(true)

    try {
      // Create swipe in database
      const result = await createSwipe.mutateAsync({
        idEmisor: userId,
        idReceptor: currentProfile.id,
        accion: "like",
      })

      setTimeout(() => {
        // Check if it's a match
        if (result.isMatch || currentProfile.hasLikedYou) {
          setMatchedProfile(currentProfile)
          setShowMatchModal(true)
        }
        moveToNextProfile()
        setSwipeDirection(null)

        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 500)
    } catch (error) {
      console.error("Error creating swipe:", error)
      setIsTransitioning(false)
      setSwipeDirection(null)
    }
  }

  const handleDislike = async () => {
    if (!currentProfile || !userId) return

    setSwipeDirection("left")
    setIsTransitioning(true)

    try {
      // Create swipe in database
      await createSwipe.mutateAsync({
        idEmisor: userId,
        idReceptor: currentProfile.id,
        accion: "pass",
      })

      setTimeout(() => {
        moveToNextProfile()
        setSwipeDirection(null)

        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 500)
    } catch (error) {
      console.error("Error creating swipe:", error)
      setIsTransitioning(false)
      setSwipeDirection(null)
    }
  }

  const moveToNextProfile = () => {
    if (profiles.length === 0) return
    
    const nextIndex = currentIndex + 1
    // Only move to next if there are more profiles, otherwise stop
    if (nextIndex < profiles.length) {
      setCurrentIndex(nextIndex)
    } else {
      // Reached the end, no more profiles to show
      setDisplayedProfile(null)
    }
  }

  const handleCloseMatchModal = () => {
    setShowMatchModal(false)
    setMatchedProfile(null)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex flex-1 items-center justify-center p-6 py-8 overflow-x-hidden w-full">
        {!userId ? (
          <div className="text-center">
            <p className="text-muted-foreground">No estás autenticado</p>
          </div>
        ) : profilesLoading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Cargando perfiles...</p>
          </div>
        ) : profilesError ? (
          <div className="text-center">
            <p className="text-red-500">Error cargando perfiles: {String(profilesError)}</p>
          </div>
        ) : !currentProfile || !displayedProfile ? (
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold">No hay más perfiles</h2>
            <p className="text-muted-foreground">
              {profiles.length === 0 
                ? "No hay perfiles disponibles que coincidan con tus preferencias" 
                : "Ya has visto todos los perfiles disponibles. Vuelve más tarde para ver nuevos perfiles"}
            </p>
            {profiles.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Has visto {profiles.length} perfil{profiles.length !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
        ) : (
          <div className={`relative w-full max-w-5xl transition-opacity duration-200 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
            <div className="relative overflow-hidden w-full">
              <ProfileCard
                profile={displayedProfile}
                onLike={handleLike}
                onDislike={handleDislike}
                swipeDirection={swipeDirection}
              />
            </div>
          </div>
        )}
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
