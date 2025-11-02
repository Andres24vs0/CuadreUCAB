import { NextRequest, NextResponse } from "next/server"
import { getMatch, getMatchMessages, getOtherUserInMatch, markMessagesAsRead } from "@/lib/db/ManejadorMensajes"

/**
 * GET /api/chats/[chatId]
 * Get messages for a specific chat/match
 * Requires userId query parameter to verify access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    // Get messages
    const messages = await getMatchMessages(chatId)

    // Get other user info
    const otherUser = await getOtherUserInMatch(chatId, userId)

    // Mark messages as read
    await markMessagesAsRead(chatId, userId)

    return NextResponse.json({
      messages,
      otherUser,
      matchId: chatId,
    })
  } catch (error) {
    console.error(`[GET /api/chats/${chatId}] Error:`, error)
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    )
  }
}
