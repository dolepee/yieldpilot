'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { mainnet, base, arbitrum, optimism } from 'viem/chains'
import { STABLECOINS, ERC20_BALANCE_ABI } from '@/lib/constants'

const chains = [mainnet, base, arbitrum, optimism] as const

function getClient(chain: typeof chains[number]) {
  return createPublicClient({ chain, transport: http() })
}

export interface TokenBalance {
  chainId: number
  chainName: string
  token: 'USDC' | 'USDT'
  address: `0x${string}`
  balance: bigint
  formatted: string
  decimals: number
  usdValue: number
}

export interface StablecoinBalances {
  balances: TokenBalance[]
  totalUsd: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useStablecoinBalances(walletAddress: `0x${string}` | undefined): StablecoinBalances {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    if (!walletAddress) {
      setBalances([])
      return
    }

    let cancelled = false

    async function fetchBalances() {
      setIsLoading(true)
      setError(null)

      try {
        const calls: Promise<TokenBalance | null>[] = []
        const wallet = walletAddress as `0x${string}`

        for (const chain of chains) {
          const client = getClient(chain)
          const stables = STABLECOINS[chain.id]
          if (!stables) continue

          for (const [token, addr] of Object.entries(stables) as ['usdc' | 'usdt', `0x${string}` | null][]) {
            if (!addr) continue

            const tokenLabel = token.toUpperCase() as 'USDC' | 'USDT'
            calls.push(
              (async () => {
                try {
                  const balance = await client.readContract({
                    address: addr,
                    abi: ERC20_BALANCE_ABI,
                    functionName: 'balanceOf',
                    args: [wallet],
                  })
                  const decimals = token === 'usdc' ? 6 : 6 // both USDC and USDT are 6 decimals
                  const formatted = formatUnits(balance, decimals)
                  return {
                    chainId: chain.id,
                    chainName: chain.name,
                    token: tokenLabel,
                    address: addr,
                    balance,
                    formatted,
                    decimals,
                    usdValue: Number(formatted),
                  }
                } catch {
                  return null
                }
              })()
            )
          }
        }

        const results = await Promise.all(calls)
        if (cancelled) return

        const valid = results.filter((r): r is TokenBalance => r !== null && r.balance > BigInt(0))
        setBalances(valid)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to fetch balances')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchBalances()
    return () => { cancelled = true }
  }, [walletAddress, fetchCount])

  const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0)

  return {
    balances,
    totalUsd,
    isLoading,
    error,
    refetch: () => setFetchCount(c => c + 1),
  }
}
