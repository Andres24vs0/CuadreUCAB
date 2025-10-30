"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, X, Briefcase, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateAge, getZodiacSign } from "@/lib/zodiac-utils"

export interface Profile {
  id: string
  nombre: string
  fechaNacimiento: string
  genero: string
  bio: string
  fotos: string[]
  intereses: string[]
  atributosFisicos: {
    colorOjos: string
    colorCabello: string
    carrera: string
  }
  hasLikedYou?: boolean
}

interface ProfileCardProps {
  profile: Profile
  onLike: () => void
  onDislike: () => void
  swipeDirection: "left" | "right" | null
}

export function ProfileCard({ profile, onLike, onDislike, swipeDirection }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const edad = calculateAge(new Date(profile.fechaNacimiento))
  const zodiac = getZodiacSign(new Date(profile.fechaNacimiento))

  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [profile.id])

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % profile.fotos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + profile.fotos.length) % profile.fotos.length)
  }

  const getSwipeClasses = () => {
    if (swipeDirection === "left") {
      return "animate-swipe-left"
    }
    if (swipeDirection === "right") {
      return "animate-swipe-right"
    }
    return ""
  }

  return (
    <Card className={`relative mx-auto w-full max-w-5xl overflow-hidden shadow-2xl ${getSwipeClasses()}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Photo Section - Left Side */}
        <div className="relative aspect-[3/4] lg:aspect-auto lg:min-h-[600px]">
          <Image
            src={profile.fotos[currentPhotoIndex] || "/placeholder.svg"}
            alt={`${profile.nombre} - Foto ${currentPhotoIndex + 1}`}
            fill
            className="object-cover"
            priority
          />

          {/* Photo Navigation */}
          {profile.fotos.length > 1 && (
            <>
              {/* Previous Button */}
              {currentPhotoIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                  onClick={prevPhoto}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Next Button */}
              {currentPhotoIndex < profile.fotos.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                  onClick={nextPhoto}
                  aria-label="Siguiente foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Photo Indicator Dots */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {profile.fotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      index === currentPhotoIndex ? "w-8 bg-white" : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Ir a foto ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile Info Section - Right Side */}
        <div className="flex flex-col justify-between bg-card p-8 lg:p-10">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-4xl font-bold text-balance">
                {profile.nombre}, {edad}
              </h2>
              <Sparkles className="h-7 w-7 flex-shrink-0 fill-secondary text-secondary" />
            </div>

            <div className="mb-6 flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-5 w-5" />
              <span className="text-lg">{profile.atributosFisicos.carrera}</span>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sobre mí</h3>
              <p className="text-base leading-relaxed text-balance">{profile.bio}</p>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Signo Zodiacal
              </h3>
              <div className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{zodiac.symbol}</span>
                <span className="font-medium">{zodiac.name}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Intereses</h3>
              <div className="flex flex-wrap gap-2">
                {profile.intereses.map((interes) => (
                  <Badge key={interes} variant="secondary" className="px-3 py-1 text-sm">
                    {interes}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Características
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Ojos:</span>
                  <span className="text-muted-foreground">{profile.atributosFisicos.colorOjos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Cabello:</span>
                  <span className="text-muted-foreground">{profile.atributosFisicos.colorCabello}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-center gap-8">
            <Button
              size="lg"
              variant="outline"
              className="h-20 w-20 rounded-full border-2 border-destructive bg-transparent text-destructive transition-all hover:scale-110 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onDislike}
            >
              <X className="h-10 w-10" />
            </Button>

            <Button
              size="lg"
              className="h-24 w-24 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:bg-primary/90"
              onClick={onLike}
            >
              <Heart className="h-12 w-12 fill-current" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
