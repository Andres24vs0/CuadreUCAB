import type { Profile } from "@/components/profile-card"
import { mockProfiles } from "./mock-profiles"

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  read: boolean
}

export interface Chat {
  id: string
  profile: Profile
  messages: Message[]
  unreadCount: number
}

// Current user ID
export const CURRENT_USER_ID = "current-user"

// Matches that haven't been messaged yet
export const newMatches: Profile[] = mockProfiles.filter((p) => p.hasLikedYou && p.id !== "1" && p.id !== "3")

// Existing chats with messages
export const existingChats: Chat[] = [
  {
    id: "chat-1",
    profile: mockProfiles[0], // María
    messages: [
      {
        id: "msg-1",
        senderId: mockProfiles[0].id,
        text: "Hola! Vi que también te gusta el café ☕",
        timestamp: new Date(2025, 0, 20, 10, 30),
        read: true,
      },
      {
        id: "msg-2",
        senderId: CURRENT_USER_ID,
        text: "Hola María! Sí, me encanta. Conoces algún buen lugar cerca del campus?",
        timestamp: new Date(2025, 0, 20, 10, 35),
        read: true,
      },
      {
        id: "msg-3",
        senderId: mockProfiles[0].id,
        text: "Hay uno nuevo que abrieron en la esquina, tienen un espresso increíble",
        timestamp: new Date(2025, 0, 20, 10, 40),
        read: true,
      },
      {
        id: "msg-4",
        senderId: CURRENT_USER_ID,
        text: "Suena genial! Te gustaría ir algún día?",
        timestamp: new Date(2025, 0, 20, 10, 45),
        read: true,
      },
      {
        id: "msg-5",
        senderId: mockProfiles[0].id,
        text: "Me encantaría! Qué tal mañana después de clases?",
        timestamp: new Date(2025, 0, 20, 14, 20),
        read: false,
      },
    ],
    unreadCount: 1,
  },
  {
    id: "chat-2",
    profile: mockProfiles[2], // Sofía
    messages: [
      {
        id: "msg-6",
        senderId: CURRENT_USER_ID,
        text: "Hola Sofía! Me gustó mucho tu perfil",
        timestamp: new Date(2025, 0, 19, 16, 15),
        read: true,
      },
      {
        id: "msg-7",
        senderId: mockProfiles[2].id,
        text: "Gracias! Vi que también te interesa la fotografía",
        timestamp: new Date(2025, 0, 19, 16, 30),
        read: true,
      },
      {
        id: "msg-8",
        senderId: mockProfiles[2].id,
        text: "Tienes algún proyecto fotográfico en mente?",
        timestamp: new Date(2025, 0, 19, 16, 31),
        read: true,
      },
      {
        id: "msg-9",
        senderId: CURRENT_USER_ID,
        text: "Estoy pensando en hacer una serie sobre el campus al atardecer",
        timestamp: new Date(2025, 0, 19, 17, 0),
        read: true,
      },
      {
        id: "msg-10",
        senderId: mockProfiles[2].id,
        text: "Wow, eso suena increíble! Me encantaría ver eso",
        timestamp: new Date(2025, 0, 20, 9, 15),
        read: true,
      },
      {
        id: "msg-11",
        senderId: mockProfiles[2].id,
        text: "Si necesitas ayuda o una segunda opinión, cuenta conmigo",
        timestamp: new Date(2025, 0, 20, 9, 16),
        read: true,
      },
      {
        id: "msg-12",
        senderId: mockProfiles[2].id,
        text: "También podríamos hacer algo juntos algún día",
        timestamp: new Date(2025, 0, 20, 9, 17),
        read: true,
      },
      {
        id: "msg-13",
        senderId: CURRENT_USER_ID,
        text: "Me encantaría! Sería genial colaborar en algo",
        timestamp: new Date(2025, 0, 20, 10, 0),
        read: true,
      },
      {
        id: "msg-14",
        senderId: mockProfiles[2].id,
        text: "Perfecto! Qué tipo de fotografía te gusta más?",
        timestamp: new Date(2025, 0, 20, 10, 5),
        read: true,
      },
      {
        id: "msg-15",
        senderId: CURRENT_USER_ID,
        text: "Me gusta mucho la fotografía de paisajes y arquitectura",
        timestamp: new Date(2025, 0, 20, 10, 10),
        read: true,
      },
      {
        id: "msg-16",
        senderId: mockProfiles[2].id,
        text: "A mí también! El campus tiene lugares increíbles para fotografiar",
        timestamp: new Date(2025, 0, 20, 10, 15),
        read: true,
      },
      {
        id: "msg-17",
        senderId: CURRENT_USER_ID,
        text: "Sí! La biblioteca al atardecer es espectacular",
        timestamp: new Date(2025, 0, 20, 10, 20),
        read: true,
      },
      {
        id: "msg-18",
        senderId: mockProfiles[2].id,
        text: "Totalmente de acuerdo! Y los jardines también",
        timestamp: new Date(2025, 0, 20, 10, 25),
        read: true,
      },
      {
        id: "msg-19",
        senderId: CURRENT_USER_ID,
        text: "Deberíamos planear una sesión fotográfica pronto",
        timestamp: new Date(2025, 0, 20, 10, 30),
        read: true,
      },
      {
        id: "msg-20",
        senderId: mockProfiles[2].id,
        text: "Me parece excelente! Qué tal este fin de semana?",
        timestamp: new Date(2025, 0, 20, 10, 35),
        read: true,
      },
      {
        id: "msg-21",
        senderId: CURRENT_USER_ID,
        text: "Perfecto! El sábado en la tarde estaría bien?",
        timestamp: new Date(2025, 0, 20, 10, 40),
        read: true,
      },
      {
        id: "msg-22",
        senderId: mockProfiles[2].id,
        text: "Sí! Nos vemos el sábado entonces 📸",
        timestamp: new Date(2025, 0, 20, 10, 45),
        read: false,
      },
    ],
    unreadCount: 1,
  },
]

export function getTotalUnreadCount(): number {
  return existingChats.reduce((total, chat) => total + chat.unreadCount, 0)
}
