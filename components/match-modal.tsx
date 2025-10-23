"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Sparkles } from "lucide-react"
import Image from "next/image"
import type { Profile } from "./profile-card"

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  matchedProfile: Profile | null
  currentUserPhoto: string
}

export function MatchModal({ isOpen, onClose, matchedProfile, currentUserPhoto }: MatchModalProps) {
  if (!matchedProfile) return null

  const handleGoToChat = () => {
    // Navigate to chat
    window.location.href = `/chats/${matchedProfile.id}`
  }

  const handleKeepDiscovering = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 bg-gradient-to-br from-primary via-primary/95 to-secondary p-0 text-primary-foreground">
        <div className="relative overflow-hidden p-8 text-center">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-white blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="mb-6 flex justify-center">
              <Sparkles className="h-16 w-16 animate-pulse fill-secondary text-secondary" />
            </div>

            <h2 className="mb-2 text-4xl font-bold text-balance">{"¡Es un Match!"}</h2>
            <p className="mb-8 text-lg text-primary-foreground/90">A {matchedProfile.nombre} también le gustas</p>

            {/* Profile Photos */}
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <Image src={currentUserPhoto || "/placeholder.svg"} alt="Tu foto" fill className="object-cover" />
              </div>

              <Heart className="h-12 w-12 fill-secondary text-secondary" />

              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <Image
                  src={matchedProfile.fotos[0] || "/placeholder.svg"}
                  alt={matchedProfile.nombre}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90" onClick={handleGoToChat}>
                <MessageCircle className="mr-2 h-5 w-5" />
                Enviar mensaje
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="w-full text-white hover:bg-white/10 hover:text-white"
                onClick={handleKeepDiscovering}
              >
                Seguir descubriendo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
