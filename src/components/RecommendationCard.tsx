'use client'

import type { RecommendationResult } from '@/lib/ranking'
import { CHAIN_META } from '@/lib/constants'

interface RecommendationCardProps {
  result: RecommendationResult
  mandateName: string
  onExecute?: () => void
  isLoadingQuote?: boolean
}

function RefusalCard({ result, mandateName }: { result: RecommendationResult; mandateName: string }) {
  return (
    <div className="card p-6 border-red-500/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">No move recommended</h3>
          <p className="text-sm text-gray-500">{mandateName} mandate</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {result.refusalReasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <span className="text-red-400 text-sm mt-0.5">x</span>
            <p className="text-sm text-gray-300">{reason}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5">
        <p className="text-xs text-gray-600">
          Scanned {result.candidatesScanned} vaults. {result.candidatesFiltered} passed filters.
          Your funds stay put. This is by design.
        </p>
      </div>
    </div>
  )
}

export function RecommendationCard({ result, mandateName, onExecute, isLoadingQuote }: RecommendationCardProps) {
  if (result.type === 'refused' || !result.top) {
    return <RefusalCard result={result} mandateName={mandateName} />
  }

  const { vault, score, reasons, matchedBalance } = result.top
  const tvl = Number(vault.analytics.tvl.usd)
  const chainMeta = CHAIN_META[vault.chainId]
  const isSameChain = matchedBalance.chainId === vault.chainId

  return (
    <div className="card p-6 border-green-500/20 glow-blue">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Move recommended</h3>
          <p className="text-sm text-gray-500">{mandateName} mandate satisfied</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-400">{vault.analytics.apy.total.toFixed(2)}%</p>
          <p className="text-xs text-gray-500">APY</p>
        </div>
      </div>

      {/* Vault details */}
      <div className="rounded-lg bg-white/[0.02] p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Vault</span>
          <span className="text-sm font-medium text-white">{vault.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Protocol</span>
          <span className="text-sm font-medium text-white">{vault.protocol.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Chain</span>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: chainMeta?.color || '#666' }}
            />
            <span className="text-sm font-medium text-white">{vault.network}</span>
            {isSameChain && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">same-chain</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">TVL</span>
          <span className="text-sm font-medium text-white">${(tvl / 1_000_000).toFixed(1)}M</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">APY breakdown</span>
          <span className="text-sm font-medium text-white">
            {vault.analytics.apy.base.toFixed(2)}% base
            {vault.analytics.apy.reward ? ` + ${vault.analytics.apy.reward.toFixed(2)}% reward` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Amount</span>
          <span className="text-sm font-medium text-white">
            ${matchedBalance.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {matchedBalance.token}
          </span>
        </div>
      </div>

      {/* Why this vault won */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Why this opportunity</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((r, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Score and action */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <p className="text-xs text-gray-600">
          Score: {score.toFixed(1)}/100 across {result.candidatesFiltered} compliant vaults
        </p>
        {onExecute && (
          <button
            onClick={onExecute}
            disabled={isLoadingQuote}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoadingQuote ? 'Analyzing route...' : 'Analyze move'}
          </button>
        )}
      </div>
    </div>
  )
}
