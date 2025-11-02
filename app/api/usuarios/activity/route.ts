import { NextRequest, NextResponse } from "next/server"
import { updateLastConnection } from "@/lib/db/ManejadorUsuarios"

/**
 * POST /api/usuarios/activity
 * Update user's last connection time
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    await updateLastConnection(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/usuarios/activity] Error:", error)
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    )
  }
}
