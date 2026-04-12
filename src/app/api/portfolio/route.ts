import { NextResponse } from 'next/server'
import { fetchPortfolio } from '@/lib/earn-api'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 })
  }

  try {
    const portfolio = await fetchPortfolio(address)
    return NextResponse.json(
      { portfolio },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load portfolio positions'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
