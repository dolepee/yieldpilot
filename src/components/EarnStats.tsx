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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse p-6 md:p-7">
            <div className="mb-6 h-2 w-28 rounded bg-white/5" />
            <div className="h-9 w-20 rounded bg-white/5" />
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
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#00d4aa]">Market Universe</p>
          <h2 className="mt-2 text-xl font-semibold text-white">LI.FI Earn rails indexed</h2>
        </div>
        <p className="hidden max-w-sm text-right text-xs leading-5 text-white/35 md:block">
          Global vault data loads before wallet connect. Account-specific routing starts after the balance scan.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card border-cyan-400/15 p-6 md:p-7">
          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-white/35">Vaults Indexed</p>
          <p className="font-mono text-4xl font-semibold tabular-nums text-cyan-200">{vaults.length}</p>
          <div className="mt-5 h-px w-full bg-cyan-400/20" />
          <p className="mt-3 text-xs text-white/35">transactional yield endpoints</p>
        </div>
        <div className="card border-violet-400/15 p-6 md:p-7">
          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-white/35">Supported Chains</p>
          <p className="font-mono text-4xl font-semibold tabular-nums text-violet-200">{chains.length}</p>
          <div className="mt-5 h-px w-full bg-violet-400/20" />
          <p className="mt-3 text-xs text-white/35">cross-chain routing surface</p>
        </div>
        <div className="card border-[#00d4aa]/25 p-6 md:p-7 glow-teal">
          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-white/35">Avg. Stablecoin APY</p>
          <p className="font-mono text-4xl font-semibold tabular-nums text-[#00d4aa]">{avgApy.toFixed(2)}%</p>
          <div className="mt-5 h-px w-full bg-[#00d4aa]/20" />
          <p className="mt-3 text-xs text-white/35">stablecoin-tagged opportunities</p>
        </div>
      </div>
    </section>
  )
}
