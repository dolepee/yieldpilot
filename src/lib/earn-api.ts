import { EARN_API_BASE } from './constants'

function authHeaders(): HeadersInit {
  const apiKey = process.env.LIFI_API_KEY
  if (!apiKey) throw new Error('LIFI_API_KEY not configured')
  return { 'x-lifi-api-key': apiKey }
}

export interface VaultApy {
  base: number
  reward: number | null
  total: number
}

export interface VaultAnalytics {
  apy: VaultApy
  apy1d: number | null
  apy7d: number | null
  apy30d: number | null
  tvl: { usd: string }
  updatedAt: string
}

export interface VaultProtocol {
  name: string
  url: string
}

export interface UnderlyingToken {
  address: string
  symbol: string
  decimals: number
}

export interface Vault {
  address: string
  network: string
  chainId: number
  slug: string
  name: string
  description: string
  protocol: VaultProtocol
  underlyingTokens: UnderlyingToken[]
  tags: string[]
  analytics: VaultAnalytics
  isTransactional: boolean
  isRedeemable: boolean
  depositPacks: { name: string; stepsType: string }[]
  redeemPacks: { name: string; stepsType: string }[]
}

export interface VaultsResponse {
  data: Vault[]
  nextCursor: string | null
  total: number
}

export interface EarnChain {
  chainId: number
  name: string
  networkCaip: string
}

export interface EarnProtocol {
  name: string
  url: string
}

// Fetch all vaults with pagination
export async function fetchAllVaults(chainId?: number): Promise<Vault[]> {
  const allVaults: Vault[] = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams()
    if (chainId) params.set('chainId', String(chainId))
    if (cursor) params.set('cursor', cursor)

    const url = `${EARN_API_BASE}/v1/vaults${params.toString() ? '?' + params.toString() : ''}`
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Earn API error: ${res.status}`)

    const data: VaultsResponse = await res.json()
    allVaults.push(...data.data)
    cursor = data.nextCursor
  } while (cursor)

  return allVaults
}

// Fetch single vault detail
export async function fetchVaultDetail(network: string, address: string): Promise<Vault> {
  const res = await fetch(`${EARN_API_BASE}/v1/vaults/${network}/${address}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Vault detail error: ${res.status}`)
  return res.json()
}

// Fetch supported chains
export async function fetchChains(): Promise<EarnChain[]> {
  const res = await fetch(`${EARN_API_BASE}/v1/chains`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Chains error: ${res.status}`)
  return res.json()
}

// Fetch supported protocols
export async function fetchProtocols(): Promise<EarnProtocol[]> {
  const res = await fetch(`${EARN_API_BASE}/v1/protocols`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Protocols error: ${res.status}`)
  return res.json()
}

// Fetch portfolio positions
export async function fetchPortfolio(userAddress: string) {
  const res = await fetch(`${EARN_API_BASE}/v1/portfolio/${userAddress}/positions`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Portfolio error: ${res.status}`)
  return res.json()
}
