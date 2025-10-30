"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Profile } from "@/components/profile-card"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { calculateAge, getZodiacSign } from "@/lib/zodiac-utils"

interface ProfileCardModalProps {
  profile: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileCardModal({ profile, open, onOpenChange }: ProfileCardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [profile])

  if (!profile) return null

  const edad = calculateAge(new Date(profile.fechaNacimiento))
  const zodiac = getZodiacSign(new Date(profile.fechaNacimiento))

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profile.fotos.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profile.fotos.length) % profile.fotos.length)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] overflow-hidden rounded-2xl p-0 md:max-w-6xl">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-[400px] w-full md:h-[650px] md:w-[60%]">
            <Image
              src={profile.fotos[currentImageIndex] || "/placeholder.svg"}
              alt={profile.nombre}
              fill
              className="object-cover"
            />

            {/* Image navigation buttons */}
            {profile.fotos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {profile.fotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentImageIndex ? "w-8 bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-ucab-maroon">
                {profile.nombre}, {edad}
              </h2>
              <p className="text-lg text-ucab-golden">{profile.atributosFisicos.carrera}</p>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-base font-semibold text-ucab-maroon">Sobre mí</h3>
              <p className="leading-relaxed text-foreground">{profile.bio}</p>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-base font-semibold text-ucab-maroon">Signo Zodiacal</h3>
              <div className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{zodiac.symbol}</span>
                <span className="font-medium text-foreground">{zodiac.name}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-base font-semibold text-ucab-maroon">Intereses</h3>
              <div className="flex flex-wrap gap-2">
                {profile.intereses.map((interes, index) => (
                  <span
                    key={index}
                    className="rounded-full border-2 border-ucab-maroon bg-white px-3 py-1 text-sm font-medium text-ucab-maroon"
                  >
                    {interes}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border-2 border-ucab-golden/30 bg-ucab-golden/5 p-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-ucab-maroon">👁️ Ojos:</span>
                <span className="text-foreground">{profile.atributosFisicos.colorOjos}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-ucab-maroon">💇 Cabello:</span>
                <span className="text-foreground">{profile.atributosFisicos.colorCabello}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
