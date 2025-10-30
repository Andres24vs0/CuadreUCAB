import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateProfile } from '@/lib/db/ManejadorUsuarios'

const perfilUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  genero: z.string().optional(),
  bio: z.string().optional(),
  password: z.string().min(8).optional(),
  fotos: z.union([z.array(z.string()), z.string()]).optional(),
  intereses: z.union([z.array(z.string()), z.string()]).optional(),
  atributosFisicos: z.record(z.any()).optional(),
  carrera: z.string().optional(),
  preferencias: z.any().optional(),
  fechaNacimiento: z.union([z.string(), z.number()]).optional(),
})

/**
 * PATCH /api/usuarios/[id]
 * Body: partial perfil object
 * Returns: updated PublicProfile
 * NOTE: This route does NOT implement auth. Ensure you check the authenticated user before calling this in production.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json().catch(() => ({}))

  const resolvedParams = await params

    const parsed = perfilUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    // Normalize some common fields
    const data = parsed.data as any
    const updates: Record<string, any> = { ...data }

    if (updates.fotos && typeof updates.fotos === 'string') {
      updates.fotos = [updates.fotos]
    }
    if (updates.intereses && typeof updates.intereses === 'string') {
      updates.intereses = [updates.intereses]
    }

    if (updates.fechaNacimiento !== undefined && updates.fechaNacimiento !== null) {
      const raw = updates.fechaNacimiento
      const fecha = typeof raw === 'number' ? new Date(raw) : new Date(String(raw))
      if (!isNaN(fecha.getTime())) {
        updates.fechaNacimiento = fecha
      } else {
        // invalid date
        return NextResponse.json({ error: 'Invalid fechaNacimiento' }, { status: 400 })
      }
    }

    // Call DB updater
  const rawId = typeof resolvedParams.id === 'string' ? decodeURIComponent(resolvedParams.id).trim() : resolvedParams.id
  const updated = await updateProfile(rawId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('PATCH /api/usuarios/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Use default Node runtime to allow modules like mongodb that require Node's crypto module.
