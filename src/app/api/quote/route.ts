import { NextResponse } from 'next/server'

const COMPOSER_API_BASE = 'https://li.quest'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const apiKey = process.env.LIFI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'LIFI_API_KEY not configured' }, { status: 500 })
  }

  // Forward all query params to Composer
  const composerUrl = `${COMPOSER_API_BASE}/v1/quote?${searchParams.toString()}`

  try {
    const res = await fetch(composerUrl, {
      headers: {
        'x-lifi-api-key': apiKey,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Quote fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
