'use client'

import type { ScoredVault } from '@/lib/ranking'
import { CHAIN_META } from '@/lib/constants'

interface RouteDuelPanelProps {
  candidates: ScoredVault[]
  selectedCandidate: ScoredVault
  onSelectCandidate: (candidate: ScoredVault) => void
}

function routeKey(candidate: ScoredVault): string {
  return `${candidate.vault.slug}-${candidate.vault.chainId}-${candidate.matchedBalance.chainId}-${candidate.matchedBalance.token}`
}

function compactUsd(value: number): string {
  if (!Number.isFinite(value)) return 'n/a'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function RouteOption({
  candidate,
  label,
  isSelected,
  onSelect,
}: {
  candidate: ScoredVault | null
  label: string
  isSelected: boolean
  onSelect: () => void
}) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/70 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="mt-4 text-sm text-white/55">No route passed this mandate.</p>
        <p className="mt-2 text-xs leading-5 text-white/35">
          YieldPilot refuses this lane unless a vault clears the token, TVL, APY, protocol, and chain constraints.
        </p>
      </div>
    )
  }

  const sourceMeta = CHAIN_META[candidate.matchedBalance.chainId]
  const targetMeta = CHAIN_META[candidate.vault.chainId]
  const isSameChain = candidate.matchedBalance.chainId === candidate.vault.chainId
  const tvl = Number(candidate.vault.analytics.tvl.usd)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
        isSelected
          ? 'border-[#00d4aa]/45 bg-[#00d4aa]/10 shadow-[0_0_28px_rgba(0,212,170,0.13)]'
          : 'border-white/10 bg-[#0a0a0a]/70 hover:border-[#00d4aa]/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
          <p className="mt-3 text-sm font-semibold text-white">{candidate.vault.name}</p>
          <p className="mt-1 text-xs text-white/45">{candidate.vault.protocol.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-semibold text-[#00d4aa]">{candidate.vault.analytics.apy.total.toFixed(2)}%</p>
          <p className="font-mono text-xs text-white/35">score {candidate.score.toFixed(1)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-white/50">
        <div className="flex items-center justify-between">
          <span>Route</span>
          <span className="font-mono text-white/75">
            {isSameChain ? targetMeta?.name ?? candidate.vault.network : `${sourceMeta?.name ?? candidate.matchedBalance.chainName} -> ${targetMeta?.name ?? candidate.vault.network}`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mode</span>
          <span className={isSameChain ? 'text-[#00d4aa]' : 'text-cyan-200'}>
            {isSameChain ? 'same-chain' : 'bridge + deposit'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>TVL</span>
          <span className="font-mono text-white/75">{compactUsd(tvl)}</span>
        </div>
      </div>
    </button>
  )
}

export function RouteDuelPanel({ candidates, selectedCandidate, onSelectCandidate }: RouteDuelPanelProps) {
  const source = selectedCandidate.matchedBalance
  const sourceCandidates = candidates.filter(candidate =>
    candidate.matchedBalance.chainId === source.chainId &&
    candidate.matchedBalance.token === source.token
  )

  const sameChain = sourceCandidates.find(candidate => candidate.vault.chainId === source.chainId) ?? null
  const crossChain = sourceCandidates.find(candidate => candidate.vault.chainId !== source.chainId) ?? null
  const selectedKey = routeKey(selectedCandidate)
  const sourceMeta = CHAIN_META[source.chainId]

  return (
    <div className="rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/[0.035] p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Route Duel</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Same-chain vs cross-chain</h3>
          <p className="mt-1 text-sm text-white/45">
            Source: {source.formatted} {source.token} on {sourceMeta?.name ?? source.chainName}. Composer cost check still happens before execution.
          </p>
        </div>
        <p className="max-w-sm text-xs leading-5 text-white/35">
          Same-chain is preferred when it wins on break-even. Cross-chain only wins when extra APY pays for the bridge and gas.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <RouteOption
          label="Best same-chain lane"
          candidate={sameChain}
          isSelected={sameChain ? routeKey(sameChain) === selectedKey : false}
          onSelect={() => sameChain && onSelectCandidate(sameChain)}
        />
        <RouteOption
          label="Best cross-chain lane"
          candidate={crossChain}
          isSelected={crossChain ? routeKey(crossChain) === selectedKey : false}
          onSelect={() => crossChain && onSelectCandidate(crossChain)}
        />
      </div>
    </div>
  )
}
