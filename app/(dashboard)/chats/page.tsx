"use client"

import { Navbar } from "@/components/navbar"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ProfileCardModal } from "@/components/profile-card-modal"
import type { Profile } from "@/components/profile-card"
import { useRouter } from "next/navigation"
import { useChats } from "@/lib/queries/chat-queries"

export const dynamic = "force-dynamic"

export default function ChatsPage() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  // Fetch chats from database
  const { data: chats, isLoading, error } = useChats()

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile)
    setIsModalOpen(true)
  }

  const handleChatClick = (matchId: string) => {
    router.push(`/chats/${matchId}`)
  }

  // Separate chats into new matches (no messages) and existing chats (with messages)
  const newMatches = chats?.filter((chat) => !chat.lastMessage) || []
  const existingChats = chats?.filter((chat) => chat.lastMessage) || []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background p-6">
        <div className="container mx-auto max-w-4xl">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-ucab-maroon border-r-transparent"></div>
              <p className="ml-4 text-gray-600">Cargando chats...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600">Error al cargar los chats. Por favor, intenta de nuevo.</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {newMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-bold text-ucab-maroon">Nuevos Matches</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Escríbeles a las personas con las que has hecho match
                  </p>
                  <div className="flex gap-4 overflow-x-auto px-2 pb-4 pt-2">
                    {newMatches.map((match) => (
                      <button
                        key={match.matchId}
                        onClick={() => handleChatClick(match.matchId)}
                        className="flex flex-shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105"
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-ucab-golden">
                          <Image
                            src={match.otherUser.fotos[0] || "/placeholder.svg"}
                            alt={match.otherUser.nombre}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm font-medium">{match.otherUser.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="mb-4 text-xl font-bold text-ucab-maroon">Mensajes</h2>
                {existingChats.length === 0 && newMatches.length === 0 && (
                  <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">No tienes chats aún</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cuando hagas match con alguien, aparecerá aquí
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  {existingChats.map((chat) => (
                    <Link
                      key={chat.matchId}
                      href={`/chats/${chat.matchId}`}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const profile: Profile = {
                            id: chat.otherUser.id,
                            discoverableScore: 0,
                            nombre: chat.otherUser.nombre,
                            fechaNacimiento: "",
                            genero: "",
                            bio: "",
                            fotos: chat.otherUser.fotos,
                            intereses: [],
                            atributosFisicos: {
                              colorOjos: "",
                              colorCabello: "",
                              carrera: chat.otherUser.carrera,
                            },
                            hasLikedYou: false,
                          }
                          handleProfileClick(profile)
                        }}
                        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full"
                      >
                        <Image
                          src={chat.otherUser.fotos[0] || "/placeholder.svg"}
                          alt={chat.otherUser.nombre}
                          fill
                          className="object-cover"
                        />
                      </button>

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">{chat.otherUser.nombre}</h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(chat.lastMessage.timestamp).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {chat.lastMessage?.text || "Di hola 👋"}
                          </p>
                          {chat.unreadCount > 0 && (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ucab-maroon text-xs font-bold text-white">
                              {chat.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <ProfileCardModal profile={selectedProfile} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
