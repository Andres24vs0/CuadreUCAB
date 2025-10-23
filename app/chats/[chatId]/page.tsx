"use client"

import { useParams, useRouter } from "next/navigation"
import { existingChats, newMatches, CURRENT_USER_ID } from "@/lib/mock-chats"
import Image from "next/image"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { ProfileCardModal } from "@/components/profile-card-modal"
import type { Profile } from "@/components/profile-card"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string

  const existingChat = existingChats.find((c) => c.id === chatId)
  const newMatch = newMatches.find((m) => m.id === chatId)

  const chat = existingChat || (newMatch ? { id: newMatch.id, profile: newMatch, messages: [], unreadCount: 0 } : null)

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState(chat?.messages || [])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  if (!chat) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chat no encontrado</p>
      </div>
    )
  }

  const handleProfileClick = () => {
    setSelectedProfile(chat.profile)
    setIsModalOpen(true)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: CURRENT_USER_ID,
        text: message.trim(),
        timestamp: new Date(),
      }
      setMessages([...messages, newMessage])
      setMessage("")
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-4 border-b border-border bg-card p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <button onClick={handleProfileClick} className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image
              src={chat.profile.fotos[0] || "/placeholder.svg"}
              alt={chat.profile.nombre}
              fill
              className="object-cover"
            />
          </div>

          <div className="text-left">
            <h2 className="font-semibold text-foreground">{chat.profile.nombre}</h2>
            <p className="text-sm text-muted-foreground">{chat.profile.atributosFisicos.carrera}</p>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-background p-4 pb-1">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.senderId === CURRENT_USER_ID
            return (
              <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isCurrentUser ? "bg-ucab-maroon text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <p className={`mt-1 text-xs ${isCurrentUser ? "text-white/70" : "text-muted-foreground"}`}>
                    {msg.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
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
          />
          <Button onClick={handleSendMessage} size="icon" className="bg-ucab-maroon hover:bg-ucab-maroon/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ProfileCardModal profile={selectedProfile} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
