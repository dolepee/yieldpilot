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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse p-6">
            <div className="mb-4 h-3 w-28 rounded bg-white/5" />
            <div className="h-8 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-white/10 p-6">
        <p className="text-sm text-white">Failed to load LI.FI Earn market data.</p>
        <p className="mt-2 font-mono text-xs text-white/50">{error}</p>
      </div>
    )
  }

  const stablecoinVaults = vaults.filter(v => v.tags.includes('stablecoin') && v.isTransactional)
  const avgApy = stablecoinVaults.length > 0
    ? stablecoinVaults.reduce((s, v) => s + v.analytics.apy.total, 0) / stablecoinVaults.length
    : 0

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="card p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Vaults Indexed</p>
        <p className="font-mono text-3xl font-semibold tabular-nums text-white">{vaults.length}</p>
      </div>
      <div className="card p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Supported Chains</p>
        <p className="font-mono text-3xl font-semibold tabular-nums text-white">{chains.length}</p>
      </div>
      <div className="card border-[#00d4aa]/20 p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Avg. Best Stablecoin APY</p>
        <p className="font-mono text-3xl font-semibold tabular-nums text-[#00d4aa]">{avgApy.toFixed(2)}%</p>
      </div>
    </div>
  )
}
