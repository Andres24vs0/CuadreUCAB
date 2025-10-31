import { NextResponse } from 'next/server'
import { getDiscoverableProfiles } from '@/lib/db/ManejadorSwipes'

/**
 * GET /api/discover
 * Get discoverable profiles for the current user
 * Query params: userId (required), limit (optional, default 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('[API] Fetching discoverable profiles for userId:', userId)
    const profiles = await getDiscoverableProfiles(userId, limit)
    console.log('[API] Found', profiles.length, 'profiles')
    
    return NextResponse.json(profiles)
  } catch (err: any) {
    console.error('GET /api/discover error:', err)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}

