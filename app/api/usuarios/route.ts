import { NextResponse } from "next/server"
import { getProfiles, getProfileById } from "@/lib/db/ManejadorUsuarios"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (id) {
      const profile = await getProfileById(id)
      if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(profile)
    }
  const profiles = await getProfiles()
  return NextResponse.json(profiles)
  } catch (err) {
    console.error("API /api/usuarios error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
