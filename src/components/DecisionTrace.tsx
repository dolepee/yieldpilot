'use client'

import type { MandateConfig } from '@/lib/mandates'
import type { RecommendationResult } from '@/lib/ranking'
import type { WorthItAnalysis } from '@/lib/worth-it'

interface DecisionTraceProps {
  prompt?: string
  source?: 'ai' | 'fallback' | 'preset'
  mandate: MandateConfig
  scannedVaults: number
  recommendation: RecommendationResult | null
  worthItAnalysis?: WorthItAnalysis | null
  preferredChains?: string[]
}

function constraintChips(mandate: MandateConfig, preferredChains?: string[]) {
  const chips = [
    mandate.crossChainAllowed ? 'cross-chain allowed' : 'same-chain only',
    `TVL >= $${mandate.minTvlUsd >= 1_000_000
      ? `${(mandate.minTvlUsd / 1_000_000).toFixed(0)}M`
      : `${(mandate.minTvlUsd / 1_000).toFixed(0)}K`}`,
    `break-even <= ${mandate.maxBreakEvenDays}d`,
    `APY uplift >= ${(mandate.minApyImprovementBps / 100).toFixed(1)}%`,
    mandate.avoidRewardHeavy ? 'avoid reward-heavy farms' : 'reward-heavy allowed',
    mandate.sameChainPreferred ? 'same-chain preferred' : 'best route wins',
  ]

  if (preferredChains && preferredChains.length > 0) {
    chips.push(`preferred: ${preferredChains.join(', ')}`)
  }

  return chips
}

export function DecisionTrace({
  prompt,
  source,
  mandate,
  scannedVaults,
  recommendation,
  worthItAnalysis,
  preferredChains,
}: DecisionTraceProps) {
  const chips = constraintChips(mandate, preferredChains)
  const filteredVaults = recommendation?.candidatesFiltered ?? 0
  const top = recommendation?.top
  const strategySource = source === 'ai'
    ? 'AI mandate trace'
    : source === 'fallback'
      ? 'Deterministic mandate trace'
      : source === 'preset'
        ? 'Preset mandate trace'
        : 'Mandate trace'
  const finalVerdict = worthItAnalysis
    ? worthItAnalysis.verdict === 'approved'
      ? 'move approved'
      : 'funds stay put'
    : recommendation?.type === 'recommended'
      ? 'candidate found'
      : 'no compliant move'

  return (
    <div className="card p-6 border-blue-500/15 bg-gradient-to-br from-blue-500/[0.05] to-transparent">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-blue-400 mb-2">{strategySource}</p>
          <h2 className="text-lg font-semibold text-white">How YieldPilot made the decision</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI translates intent into hard constraints. Ranking and route economics stay deterministic.
          </p>
        </div>
        <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300">
          {finalVerdict}
        </div>
      </div>

      <div className="space-y-4">
        {prompt && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">1. User intent</p>
            <p className="text-sm text-gray-200">&ldquo;{prompt}&rdquo;</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-3">2. Parsed mandate</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">3. Vault universe</p>
            <p className="text-2xl font-semibold text-white">{scannedVaults}</p>
            <p className="text-sm text-gray-500">vaults scanned</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">4. Compliant vaults</p>
            <p className="text-2xl font-semibold text-white">{filteredVaults}</p>
            <p className="text-sm text-gray-500">passed the mandate</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">5. Final verdict</p>
            <p className="text-2xl font-semibold text-white">
              {worthItAnalysis
                ? worthItAnalysis.verdict === 'approved'
                  ? 'GO'
                  : 'HOLD'
                : recommendation?.type === 'recommended'
                  ? 'QUOTE'
                  : 'STOP'}
            </p>
            <p className="text-sm text-gray-500">
              {worthItAnalysis
                ? worthItAnalysis.verdict === 'approved'
                  ? 'constraints and economics passed'
                  : 'economics failed the mandate'
                : recommendation?.type === 'recommended'
                  ? 'ready for Composer analysis'
                  : 'no compliant opportunity'}
            </p>
          </div>
        </div>

        {top && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Leading candidate</p>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-white font-medium">{top.vault.name}</p>
                <p className="text-sm text-gray-500">
                  {top.vault.protocol.name} on {top.vault.network}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-lg font-semibold text-green-400">{top.vault.analytics.apy.total.toFixed(2)}% APY</p>
                <p className="text-xs text-gray-500">score {top.score.toFixed(1)}/100</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {top.reasons.slice(0, 4).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-green-500/15 bg-green-500/10 px-2.5 py-1 text-xs text-green-300"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {worthItAnalysis && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-3">Route economics</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Route cost</p>
                <p className="text-sm font-medium text-white">${worthItAnalysis.routeCostUsd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Break-even</p>
                <p className="text-sm font-medium text-white">
                  {worthItAnalysis.breakEvenDays !== null ? `${worthItAnalysis.breakEvenDays.toFixed(1)} days` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Annual uplift</p>
                <p className="text-sm font-medium text-white">+${worthItAnalysis.annualYieldUpliftUsd.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
