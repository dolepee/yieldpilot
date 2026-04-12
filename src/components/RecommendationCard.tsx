'use client'

import type { RecommendationResult, ScoredVault } from '@/lib/ranking'
import { CHAIN_META } from '@/lib/constants'
import { RouteDuelPanel } from './RouteDuelPanel'

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

function optionKey(candidate: ScoredVault): string {
  return `${candidate.vault.slug}-${candidate.vault.chainId}-${candidate.matchedBalance.chainId}-${candidate.matchedBalance.token}`
}

function RefusalCard({ result, mandateName }: { result: RecommendationResult; mandateName: string }) {
  return (
    <div className="card p-6 border-white/10">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">No move recommended</h3>
          <p className="text-sm text-white/40">{mandateName} mandate</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {result.refusalReasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-[#1a1a1a] border border-white/10">
            <span className="text-white/70 text-sm mt-0.5">x</span>
            <p className="text-sm text-white/60">{reason}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5">
        <p className="text-xs text-white/35">
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
  const sourceMeta = CHAIN_META[candidate.matchedBalance.chainId]
  const isSameChain = candidate.matchedBalance.chainId === candidate.vault.chainId

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        isSelected
          ? 'border-[#00d4aa]/40 bg-[#00d4aa]/10'
          : 'border-white/10 bg-[#121212] hover:border-[#00d4aa]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{candidate.vault.name}</span>
            <span
              className="h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]"
              style={{ backgroundColor: chainMeta?.color ?? '#00d4aa', color: chainMeta?.color ?? '#00d4aa' }}
            />
            <span className="text-xs text-white/40">{candidate.vault.network}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">
            {candidate.vault.protocol.name} · ${tvl >= 1_000_000 ? `${(tvl / 1_000_000).toFixed(0)}M` : `${(tvl / 1_000).toFixed(0)}K`} TVL
          </p>
          <p className="mt-1 text-xs text-white/35">
            {isSameChain
              ? `Same-chain on ${chainMeta?.name ?? candidate.vault.network}`
              : `Bridge ${sourceMeta?.name ?? candidate.matchedBalance.chainName} -> ${chainMeta?.name ?? candidate.vault.network}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#00d4aa]">{candidate.vault.analytics.apy.total.toFixed(2)}%</p>
          <p className="font-mono text-xs text-white/40">score {candidate.score.toFixed(1)}</p>
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
    <div className="card p-6 border-[#00d4aa]/20 glow-teal">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#00d4aa]/10 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Move recommended</h3>
          <p className="text-sm text-white/40">{mandateName} mandate satisfied</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#00d4aa]">{vault.analytics.apy.total.toFixed(2)}%</p>
          <p className="text-xs text-white/40">APY</p>
        </div>
      </div>

      <div className="mb-5">
        <RouteDuelPanel
          candidates={result.candidates}
          selectedCandidate={selectedCandidate}
          onSelectCandidate={onSelectCandidate}
        />
      </div>

      {/* Vault details */}
      <div className="rounded-md border border-white/10 bg-[#121212] p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Vault</span>
          <span className="text-sm font-medium text-white">{vault.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Protocol</span>
          <span className="text-sm font-medium text-white">{vault.protocol.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Chain</span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border shadow-[0_0_18px_currentColor]"
              style={{
                borderColor: `${chainMeta?.color ?? '#00d4aa'}66`,
                backgroundColor: `${chainMeta?.color ?? '#00d4aa'}33`,
                color: chainMeta?.color ?? '#00d4aa',
              }}
            />
            <span className="text-sm font-medium text-white">{vault.network}</span>
            {isSameChain && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#00d4aa]/10 text-[#00d4aa]">same-chain</span>
            )}
            {!isSameChain && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-200">bridge route</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">TVL</span>
          <span className="font-mono text-sm font-medium text-white">${(tvl / 1_000_000).toFixed(1)}M</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">APY breakdown</span>
          <span className="font-mono text-sm font-medium text-white">
            {vault.analytics.apy.base.toFixed(2)}% base
            {vault.analytics.apy.reward ? ` + ${vault.analytics.apy.reward.toFixed(2)}% reward` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Selected amount</span>
          <span className="font-mono text-sm font-medium text-white">
            {depositAmount || '0'} {matchedBalance.token}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Exit awareness</span>
          <span className={`text-sm font-medium ${vault.isRedeemable ? 'text-[#00d4aa]' : 'text-white/50'}`}>
            {vault.isRedeemable ? 'Redeemable vault' : 'Redeem support not advertised'}
          </span>
        </div>
      </div>

      {/* Why this vault won */}
      <div className="mb-4">
        <p className="text-xs text-white/40 mb-2 uppercase tracking-[0.18em]">Why this opportunity</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((r, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Score and action */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <p className="font-mono text-xs text-white/35">
          Score: {score.toFixed(1)}/100 across {result.candidatesFiltered} compliant vaults
        </p>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-[#121212] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Amount to analyze</p>
            <p className="mt-1 text-xs text-white/35">
              Available: {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {matchedBalance.token} on {matchedBalance.chainName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDepositAmountChange(matchedBalance.formatted)}
            className="text-xs text-[#00d4aa] hover:opacity-80"
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
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#00d4aa]/40"
          />
          {onExecute && (
            <button
              onClick={onExecute}
              disabled={isLoadingQuote || !!amountError}
              className="rounded-md bg-[#00d4aa] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 sm:min-w-36"
            >
              {isLoadingQuote ? 'Analyzing...' : 'Analyze move'}
            </button>
          )}
        </div>
        {amountError && <p className="mt-2 text-xs text-white/70">{amountError}</p>}
      </div>

      {result.candidates.length > 1 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Other compliant options</p>
            <p className="font-mono text-xs text-white/35">Top {Math.min(result.candidates.length, 5)} by score</p>
          </div>
          <div className="grid gap-2">
            {result.candidates.slice(0, 5).map((candidate) => (
              <CandidateOption
                key={optionKey(candidate)}
                candidate={candidate}
                isSelected={optionKey(candidate) === optionKey(selectedCandidate)}
                onSelect={() => onSelectCandidate(candidate)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
