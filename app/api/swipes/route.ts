import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSwipe } from '@/lib/db/ManejadorSwipes'

const swipeSchema = z.object({
  idEmisor: z.string().min(1),
  idReceptor: z.string().min(1),
  accion: z.enum(['like', 'pass']),
})

/**
 * POST /api/swipes
 * Create a swipe (like or pass)
 * Body: { idEmisor, idReceptor, accion: 'like' | 'pass' }
 * Returns: { isMatch: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const parsed = swipeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { idEmisor, idReceptor, accion } = parsed.data

    // Don't allow swiping on yourself
    if (idEmisor === idReceptor) {
      return NextResponse.json(
        { error: 'Cannot swipe on yourself' },
        { status: 400 }
      )
    }

    const result = await createSwipe(idEmisor, idReceptor, accion)
    
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('POST /api/swipes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

