'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPublicClient, formatUnits, http, type PublicClient } from 'viem'
import { mainnet, base, arbitrum, optimism } from 'viem/chains'
import { ERC4626_VAULT_ABI } from '@/lib/constants'
import type { Vault } from '@/lib/earn-api'
import { LEGACY_EARN_VAULTS } from '@/lib/legacy-vaults'

const chains = [mainnet, base, arbitrum, optimism] as const
const chainById = Object.fromEntries(chains.map((chain) => [chain.id, chain])) as Record<number, typeof chains[number] | undefined>
const rpcByChainId: Record<number, string> = {
  [mainnet.id]: 'https://ethereum-rpc.publicnode.com',
  [base.id]: 'https://base-rpc.publicnode.com',
  [arbitrum.id]: 'https://arbitrum-one-rpc.publicnode.com',
  [optimism.id]: 'https://optimism-rpc.publicnode.com',
}

export interface VaultPosition {
  vault: Vault
  source: 'earn-catalog' | 'legacy-vault'
  shares: bigint
  shareDecimals: number
  sharesFormatted: string
  underlyingAmount: bigint
  underlyingFormatted: string
  underlyingSymbol: string
  underlyingDecimals: number
  usdValue: number
  isEstimated: boolean
}

export interface VaultPositionsState {
  positions: VaultPosition[]
  totalUsd: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

function isStableSymbol(symbol: string): boolean {
  const normalized = symbol.toUpperCase()
  return normalized.includes('USD') || normalized === 'DAI'
}

function isSupportedStableVault(vault: Vault): boolean {
  if (!chainById[vault.chainId]) return false
  if (!vault.isRedeemable) return false
  return vault.underlyingTokens.some((token) => isStableSymbol(token.symbol))
}

function uniqueVaults(vaults: Vault[]): Array<Vault & { source: VaultPosition['source'] }> {
  const seen = new Set<string>()
  const candidates = [
    ...vaults.filter(isSupportedStableVault).map((vault) => ({ ...vault, source: 'earn-catalog' as const })),
    ...LEGACY_EARN_VAULTS.map((vault) => ({ ...vault, source: 'legacy-vault' as const })),
  ]

  return candidates.filter((vault) => {
    const key = `${vault.chainId}:${vault.address.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function useVaultPositions(
  walletAddress: `0x${string}` | undefined,
  vaults: Vault[]
): VaultPositionsState {
  const [positions, setPositions] = useState<VaultPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  const candidates = useMemo(() => uniqueVaults(vaults), [vaults])

  useEffect(() => {
    if (!walletAddress) {
      setPositions([])
      setError(null)
      return
    }

    let cancelled = false

    async function fetchPositions() {
      setIsLoading(true)
      setError(null)

      try {
        const wallet = walletAddress as `0x${string}`
        const clients = new Map<number, PublicClient>()

        function getClient(chainId: number) {
          const existing = clients.get(chainId)
          if (existing) return existing
          const chain = chainById[chainId]
          if (!chain) return null
          const client = createPublicClient({ chain, transport: http(rpcByChainId[chainId]) }) as PublicClient
          clients.set(chainId, client)
          return client
        }

        const results = await Promise.all(
          candidates.map(async (vault): Promise<VaultPosition | null> => {
            const client = getClient(vault.chainId)
            const underlying = vault.underlyingTokens.find((token) => isStableSymbol(token.symbol))
            if (!client || !underlying) return null

            try {
              const [shares, shareDecimals] = await Promise.all([
                client.readContract({
                  address: vault.address as `0x${string}`,
                  abi: ERC4626_VAULT_ABI,
                  functionName: 'balanceOf',
                  args: [wallet],
                }),
                client.readContract({
                  address: vault.address as `0x${string}`,
                  abi: ERC4626_VAULT_ABI,
                  functionName: 'decimals',
                }).catch(() => underlying.decimals),
              ])

              if (shares <= BigInt(0)) return null

              let isEstimated = false
              let underlyingAmount = shares

              try {
                underlyingAmount = await client.readContract({
                  address: vault.address as `0x${string}`,
                  abi: ERC4626_VAULT_ABI,
                  functionName: 'convertToAssets',
                  args: [shares],
                })
              } catch {
                isEstimated = true
                if (shareDecimals !== underlying.decimals) underlyingAmount = BigInt(0)
              }

              const underlyingFormatted = formatUnits(underlyingAmount, underlying.decimals)

              return {
                vault,
                source: vault.source,
                shares,
                shareDecimals,
                sharesFormatted: formatUnits(shares, shareDecimals),
                underlyingAmount,
                underlyingFormatted,
                underlyingSymbol: underlying.symbol,
                underlyingDecimals: underlying.decimals,
                usdValue: Number(underlyingFormatted),
                isEstimated,
              }
            } catch {
              return null
            }
          })
        )

        if (cancelled) return

        const nextPositions = results
          .filter((position): position is VaultPosition => position !== null && position.shares > BigInt(0))
          .sort((a, b) => b.usdValue - a.usdValue)

        setPositions(nextPositions)
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to scan vault positions')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchPositions()
    return () => {
      cancelled = true
    }
  }, [candidates, walletAddress, fetchCount])

  return {
    positions,
    totalUsd: positions.reduce((sum, position) => sum + position.usdValue, 0),
    isLoading,
    error,
    refetch: () => setFetchCount((count) => count + 1),
  }
}
