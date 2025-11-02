import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/stores/auth-store"

export interface ChatWithProfile {
  id: string
  matchId: string
  otherUser: {
    id: string
    nombre: string
    email: string
    fotos: string[]
    carrera: string
  }
  lastMessage?: {
    text: string
    timestamp: string
    senderId: string
  }
  unreadCount: number
  createdAt: string
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
}

export interface ChatData {
  messages: Message[]
  otherUser: {
    id: string
    nombre: string
    email: string
    fotos: string[]
    carrera: string
    genero: string
    bio: string
    intereses: string[]
    atributosFisicos: Record<string, any>
    fechaNacimiento: string | null
  } | null
  matchId: string
}

/**
 * Hook to get all chats for the current user
 */
export function useChats() {
  const userId = useAuthStore((state) => state.userId)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  return useQuery<ChatWithProfile[], Error>({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated")

      const response = await fetch(`/api/chats?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch chats")
      }
      return response.json()
    },
    enabled: !!userId && hasHydrated,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to get messages for a specific chat
 * Also marks messages as read automatically
 */
export function useChat(chatId: string) {
  const userId = useAuthStore((state) => state.userId)
  const queryClient = useQueryClient()

  return useQuery<ChatData, Error>({
    queryKey: ["chat", chatId, userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated")

      const response = await fetch(`/api/chats/${chatId}?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch chat")
      }

      // Invalidate chats list since we just marked messages as read
      queryClient.invalidateQueries({ queryKey: ["chats", userId] })

      return response.json()
    },
    enabled: !!userId && !!chatId,
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Hook to send a message
 */
export function useSendMessage(chatId: string) {
  const userId = useAuthStore((state) => state.userId)
  const queryClient = useQueryClient()

  return useMutation<Message, Error, string, { previousChat?: ChatData }>({
    mutationFn: async (text: string) => {
      if (!userId) throw new Error("User not authenticated")

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, text }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      return response.json()
    },
    onMutate: async (text) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["chat", chatId, userId] })

      // Snapshot the previous value
      const previousChat = queryClient.getQueryData<ChatData>(["chat", chatId, userId])

      // Optimistically update to the new value
      if (previousChat && userId) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          matchId: chatId,
          senderId: userId,
          text,
          timestamp: new Date().toISOString(),
          read: false,
        }

        queryClient.setQueryData<ChatData>(["chat", chatId, userId], {
          ...previousChat,
          messages: [...previousChat.messages, optimisticMessage],
        })
      }

      return { previousChat }
    },
    onError: (_err, _text, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(["chat", chatId, userId], context.previousChat)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["chat", chatId, userId] })
      queryClient.invalidateQueries({ queryKey: ["chats", userId] })
    },
  })
}

/**
 * Hook to add a message to the cache (used by Pusher)
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.userId)

  return (chatId: string, message: Message) => {
    // Update chat query data
    queryClient.setQueryData<ChatData>(["chat", chatId, userId], (old) => {
      if (!old) return old

      // Check if message already exists (avoid duplicates)
      const exists = old.messages.some((m) => m.id === message.id)
      if (exists) return old

      return {
        ...old,
        messages: [...old.messages, message],
      }
    })

    // Invalidate chats list to update last message
    queryClient.invalidateQueries({ queryKey: ["chats", userId] })
  }
}
