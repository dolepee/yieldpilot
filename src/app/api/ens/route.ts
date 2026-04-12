import { NextResponse } from 'next/server'
import { isAddress } from 'viem'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'Valid address is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.ensdata.net/${address}`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json({ name: null }, { status: 200 })
    }

    const data = await response.json()
    const name = typeof data?.ens_primary === 'string'
      ? data.ens_primary
      : typeof data?.ens === 'string'
        ? data.ens
        : null

    return NextResponse.json({ name })
  } catch {
    return NextResponse.json({ name: null }, { status: 200 })
  }
}
