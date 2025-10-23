"use client"

import { Navbar } from "@/components/navbar"
import { existingChats, newMatches } from "@/lib/mock-chats"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ProfileCardModal } from "@/components/profile-card-modal"
import type { Profile } from "@/components/profile-card"
import { useRouter } from "next/navigation"

export default function ChatsPage() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile)
    setIsModalOpen(true)
  }

  const handleNewMatchClick = (matchId: string) => {
    router.push(`/chats/${matchId}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background p-6">
        <div className="container mx-auto max-w-4xl">
          {newMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-ucab-maroon">Nuevos Matches</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Escríbeles a las personas con las que has hecho match
              </p>
              <div className="flex gap-4 overflow-x-auto px-2 pb-4 pt-2">
                {newMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => handleNewMatchClick(match.id)}
                    className="flex flex-shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-ucab-golden">
                      <Image
                        src={match.fotos[0] || "/placeholder.svg"}
                        alt={match.nombre}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{match.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-xl font-bold text-ucab-maroon">Mensajes</h2>
            <div className="space-y-2">
              {existingChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleProfileClick(chat.profile)
                    }}
                    className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full"
                  >
                    <Image
                      src={chat.profile.fotos[0] || "/placeholder.svg"}
                      alt={chat.profile.nombre}
                      fill
                      className="object-cover"
                    />
                  </button>

                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{chat.profile.nombre}</h3>
                      <p className="text-sm text-muted-foreground">{chat.profile.atributosFisicos.carrera}</p>
                    </div>

                    {chat.unreadCount > 0 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ucab-maroon text-xs font-bold text-white">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ProfileCardModal profile={selectedProfile} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
