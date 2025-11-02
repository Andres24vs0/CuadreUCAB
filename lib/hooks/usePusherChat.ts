import { useEffect } from "react"
import { pusherClient } from "@/lib/pusher-client"
import { useAddMessageToCache } from "@/lib/queries/chat-queries"
import type { Message } from "@/lib/queries/chat-queries"

/**
 * Hook to subscribe to Pusher events for a specific chat
 * Automatically adds incoming messages to React Query cache
 */
export function usePusherChat(chatId: string | null) {
  const addMessageToCache = useAddMessageToCache()

  useEffect(() => {
    if (!chatId) return

    const channelName = `chat-${chatId}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind("new-message", (message: Message) => {
      // Add message to cache
      addMessageToCache(chatId, message)
    })

    return () => {
      channel.unbind("new-message")
      pusherClient.unsubscribe(channelName)
    }
  }, [chatId, addMessageToCache])
}
