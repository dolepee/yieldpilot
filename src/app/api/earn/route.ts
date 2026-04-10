import { NextResponse } from 'next/server'
import { fetchAllVaults, fetchChains, fetchProtocols } from '@/lib/earn-api'

export async function GET() {
  try {
    const [vaults, chains, protocols] = await Promise.all([
      fetchAllVaults(),
      fetchChains(),
      fetchProtocols(),
    ])

    return NextResponse.json(
      { vaults, chains, protocols },
      {
        status: 200,
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=120',
        },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load Earn bootstrap data'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
