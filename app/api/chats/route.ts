import { NextRequest, NextResponse } from "next/server"
import { getUserChats } from "@/lib/db/ManejadorMensajes"

/**
 * GET /api/chats
 * Get all chats for the current user
 * Requires userId query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    const chats = await getUserChats(userId)
    return NextResponse.json(chats)
  } catch (error) {
    console.error("[GET /api/chats] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}
