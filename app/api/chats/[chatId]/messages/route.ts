import { NextRequest, NextResponse } from "next/server"
import { sendMessage, getMatch } from "@/lib/db/ManejadorMensajes"
import pusherServer from "@/lib/pusher-server"

/**
 * POST /api/chats/[chatId]/messages
 * Send a message in a chat
 * Body: { userId: string, text: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  try {
    const body = await request.json()
    const { userId, text } = body

    if (!userId || !text) {
      return NextResponse.json(
        { error: "userId and text are required" },
        { status: 400 }
      )
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text must be a non-empty string" },
        { status: 400 }
      )
    }

    // Verify user is part of this match
    const match = await getMatch(chatId, userId)
    if (!match) {
      return NextResponse.json(
        { error: "Match not found or access denied" },
        { status: 404 }
      )
    }

    // Send the message
    const message = await sendMessage(chatId, userId, text.trim())

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`chat-${chatId}`, "new-message", {
      id: message.id,
      matchId: message.matchId,
      senderId: message.senderId,
      text: message.text,
      timestamp: message.timestamp,
      read: message.read,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error(`[POST /api/chats/${chatId}/messages] Error:`, error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
