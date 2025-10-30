import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongo"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ message: "Faltan credenciales" }, { status: 400 })

    const db = await getDb()
    const user = await db.collection("usuarios").findOne({ email })
    if (!user) return NextResponse.json({ message: "No hay cuenta vinculada a este correo" }, { status: 401 })

    if (password !== user.password) {
      return NextResponse.json({ message: "La contraseña colocada no es la correcta" }, { status: 401 })
    }

    const publicUser = {
      id: user._id?.toString() ?? user.email,
      email: user.email,
      creadoEn: user.creadoEn ? new Date(user.creadoEn).toISOString() : undefined,
      perfil: user.perfil ?? {},
      ultimaConexion: user.ultimaConexion ? new Date(user.ultimaConexion).toISOString() : undefined,
    }

    return NextResponse.json(publicUser)
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}