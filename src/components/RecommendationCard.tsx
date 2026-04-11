'use client'

import type { RecommendationResult, ScoredVault } from '@/lib/ranking'
import { CHAIN_META } from '@/lib/constants'

interface RecommendationCardProps {
  result: RecommendationResult
  mandateName: string
  selectedCandidate: ScoredVault | null
  depositAmount: string
  onDepositAmountChange: (value: string) => void
  onSelectCandidate: (candidate: ScoredVault) => void
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

function CandidateOption({
  candidate,
  isSelected,
  onSelect,
}: {
  candidate: ScoredVault
  isSelected: boolean
  onSelect: () => void
}) {
  const tvl = Number(candidate.vault.analytics.tvl.usd)
  const chainMeta = CHAIN_META[candidate.vault.chainId]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        isSelected
          ? 'border-green-500/40 bg-green-500/10'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{candidate.vault.name}</span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: chainMeta?.color || '#666' }}
            />
            <span className="text-xs text-gray-500">{candidate.vault.network}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {candidate.vault.protocol.name} · ${tvl >= 1_000_000 ? `${(tvl / 1_000_000).toFixed(0)}M` : `${(tvl / 1_000).toFixed(0)}K`} TVL
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-green-400">{candidate.vault.analytics.apy.total.toFixed(2)}%</p>
          <p className="text-xs text-gray-500">score {candidate.score.toFixed(1)}</p>
        </div>
      </div>
    </button>
  )
}

export function RecommendationCard({
  result,
  mandateName,
  selectedCandidate,
  depositAmount,
  onDepositAmountChange,
  onSelectCandidate,
  onExecute,
  isLoadingQuote,
}: RecommendationCardProps) {
  if (result.type === 'refused' || !result.top || !selectedCandidate) {
    return <RefusalCard result={result} mandateName={mandateName} />
  }

  const { vault, score, reasons, matchedBalance } = selectedCandidate
  const tvl = Number(vault.analytics.tvl.usd)
  const chainMeta = CHAIN_META[vault.chainId]
  const isSameChain = matchedBalance.chainId === vault.chainId
  const maxAmount = matchedBalance.usdValue
  const amountValue = Number(depositAmount || '0')
  const amountError = !Number.isFinite(amountValue) || amountValue <= 0
    ? 'Enter an amount greater than 0.'
    : amountValue > maxAmount
      ? `Amount exceeds your ${matchedBalance.token} balance.`
      : null

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
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Amount to analyze</p>
            <p className="text-xs text-gray-600">
              Available: {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {matchedBalance.token} on {matchedBalance.chainName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDepositAmountChange(matchedBalance.formatted)}
            className="text-xs text-green-400 hover:text-green-300"
          >
            Use max
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="0"
            max={matchedBalance.formatted}
            step="0.000001"
            value={depositAmount}
            onChange={(event) => onDepositAmountChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-green-500/40"
          />
          {onExecute && (
            <button
              onClick={onExecute}
              disabled={isLoadingQuote || !!amountError}
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-600 sm:min-w-36"
            >
              {isLoadingQuote ? 'Analyzing...' : 'Analyze move'}
            </button>
          )}
        </div>
        {amountError && <p className="mt-2 text-xs text-red-400">{amountError}</p>}
      </div>

      {result.candidates.length > 1 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500">Other compliant options</p>
            <p className="text-xs text-gray-600">Top {Math.min(result.candidates.length, 5)} by score</p>
          </div>
          <div className="grid gap-2">
            {result.candidates.slice(0, 5).map((candidate) => (
              <CandidateOption
                key={`${candidate.vault.slug}-${candidate.matchedBalance.chainId}-${candidate.matchedBalance.token}`}
                candidate={candidate}
                isSelected={candidate.vault.slug === selectedCandidate.vault.slug && candidate.matchedBalance.chainId === selectedCandidate.matchedBalance.chainId}
                onSelect={() => onSelectCandidate(candidate)}
              />
            ))}
          </div>
        </div>
      )}
      </div>
  )
}
