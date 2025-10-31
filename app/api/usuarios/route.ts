import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProfileById, getProfiles } from '@/lib/db/ManejadorUsuarios'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  perfil: z.any().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { email, password, perfil } = parsed.data
    try {
      // dynamic import to avoid bundler/runtime issues
      const mod = await import('@/lib/db/ManejadorUsuarios')
      const id = await mod.registerUser({ email, password, perfil })
      // return the created public profile
      const profile = await getProfileById(id)
      return NextResponse.json({ id, profile })
    } catch (e: any) {
      if (e.message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      throw e
    }
  } catch (err: any) {
    console.error('POST /api/usuarios error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (id) {
      const profile = await getProfileById(id)
      if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(profile)
    }
    const profiles = await getProfiles()
    return NextResponse.json(profiles)
  } catch (err) {
    console.error('API /api/usuarios error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
