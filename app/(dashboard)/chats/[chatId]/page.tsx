"use client"

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { ProfileCardModal } from "@/components/profile-card-modal"
import type { Profile } from "@/components/profile-card"
import { useChat, useSendMessage } from "@/lib/queries/chat-queries"
import { useAuthStore } from "@/lib/stores/auth-store"
import { usePusherChat } from "@/lib/hooks/usePusherChat"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const userId = useAuthStore((state) => state.userId)

  // Fetch chat data
  const { data: chatData, isLoading, error } = useChat(chatId)
  const sendMessageMutation = useSendMessage(chatId)

  // Subscribe to Pusher for real-time updates
  usePusherChat(chatId)

  const [message, setMessage] = useState("")
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (chatData?.messages && chatData.messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
    }
  }, [chatData?.messages.length])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (chatData?.messages && chatData.messages.length > 0) {
      const lastMessage = chatData.messages[chatData.messages.length - 1]
      // Only auto-scroll if the last message is from the current user or if user is near bottom
      if (lastMessage.senderId === userId) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [chatData?.messages, userId])

  const handleProfileClick = () => {
    if (chatData?.otherUser) {
      const profile: Profile = {
        id: chatData.otherUser.id,
        nombre: chatData.otherUser.nombre,
        fechaNacimiento: chatData.otherUser.fechaNacimiento || "",
        genero: chatData.otherUser.genero,
        bio: chatData.otherUser.bio,
        fotos: chatData.otherUser.fotos,
        intereses: chatData.otherUser.intereses,
        atributosFisicos: {
          colorOjos: chatData.otherUser.atributosFisicos?.colorOjos || "",
          colorCabello: chatData.otherUser.atributosFisicos?.colorCabello || "",
          carrera: chatData.otherUser.carrera,
        },
        hasLikedYou: false,
      }
      setSelectedProfile(profile)
      setIsModalOpen(true)
    }
  }

  const handleSendMessage = async () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      try {
        await sendMessageMutation.mutateAsync(message.trim())
        setMessage("")
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-ucab-maroon border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (error || !chatData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Chat no encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            El chat que buscas no existe o no tienes acceso
          </p>
          <Button onClick={() => router.push("/chats")} className="mt-4" variant="outline">
            Volver a Chats
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-4 border-b border-border bg-card p-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chats")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <button
          onClick={handleProfileClick}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image
              src={chatData.otherUser?.fotos[0] || "/placeholder.svg"}
              alt={chatData.otherUser?.nombre || "Usuario"}
              fill
              className="object-cover"
            />
          </div>

          <div className="text-left">
            <h2 className="font-semibold text-foreground">{chatData.otherUser?.nombre || "Usuario"}</h2>
            <p className="text-sm text-muted-foreground">{chatData.otherUser?.carrera || ""}</p>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-background p-4 pb-1">
        <div className="container mx-auto max-w-4xl space-y-4">
          {chatData.messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Di hola a {chatData.otherUser?.nombre} para empezar la conversación 👋
              </p>
            </div>
          )}
          {chatData.messages.map((msg) => {
            const isCurrentUser = msg.senderId === userId
            return (
              <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isCurrentUser ? "bg-ucab-maroon text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <p className={`mt-1 text-xs ${isCurrentUser ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card p-4 pt-3">
        <div className="container mx-auto flex max-w-4xl gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-ucab-maroon hover:bg-ucab-maroon/90"
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ProfileCardModal profile={selectedProfile} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
