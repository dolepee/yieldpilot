'use client'

import type { EarnChain, Vault } from '@/lib/earn-api'

interface EarnStatsProps {
  vaults: Vault[]
  chains: EarnChain[]
  isLoading: boolean
  error: string | null
}

export function EarnStats({ vaults, chains, isLoading, error }: EarnStatsProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-16 mb-2" />
            <div className="h-6 bg-white/5 rounded w-10" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-4 border-red-500/20">
        <p className="text-sm text-red-400">Failed to load LI.FI Earn market data.</p>
        <p className="mt-1 text-xs text-gray-500">{error}</p>
      </div>
    )
  }

  const stablecoinVaults = vaults.filter(v => v.tags.includes('stablecoin') && v.isTransactional)
  const avgApy = stablecoinVaults.length > 0
    ? stablecoinVaults.reduce((s, v) => s + v.analytics.apy.total, 0) / stablecoinVaults.length
    : 0

  return (
    <div className="card p-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">LI.FI Earn market universe</p>
        <p className="mt-1 text-xs text-gray-600">
          Global vault data loaded before wallet connect. Your wallet-specific recommendation appears after balance scan.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.02] p-3">
          <p className="text-xs text-gray-500 mb-1">Vaults indexed</p>
          <p className="text-xl font-bold text-white">{vaults.length}</p>
        </div>
        <div className="rounded-xl bg-white/[0.02] p-3">
          <p className="text-xs text-gray-500 mb-1">Supported chains</p>
          <p className="text-xl font-bold text-white">{chains.length}</p>
        </div>
        <div className="rounded-xl bg-white/[0.02] p-3">
          <p className="text-xs text-gray-500 mb-1">Avg listed stablecoin APY</p>
          <p className="text-xl font-bold text-green-400">{avgApy.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  )
}
