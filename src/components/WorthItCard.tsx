'use client'

import type { WorthItAnalysis } from '@/lib/worth-it'

interface WorthItCardProps {
  analysis: WorthItAnalysis
  mandateName: string
  onExecute?: () => void
  isExecuting?: boolean
  actionLabel?: string
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: 'accent' | 'muted' }) {
  const colorClass = highlight === 'accent' ? 'text-[#00d4aa]'
    : highlight === 'muted' ? 'text-white/55'
    : 'text-white'

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${colorClass}`}>{value}</span>
    </div>
  )
}

export function WorthItCard({ analysis, mandateName, onExecute, isExecuting, actionLabel }: WorthItCardProps) {
  const isApproved = analysis.verdict === 'approved'

  return (
    <div className={`card p-6 ${isApproved ? 'border-[#00d4aa]/20' : 'border-white/10'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
          isApproved ? 'border-[#00d4aa]/20 bg-[#00d4aa]/10' : 'border-white/10 bg-[#1a1a1a]'
        }`}>
          {isApproved ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {isApproved ? 'Move approved' : 'Move not worth it'}
          </h3>
          <p className="text-sm text-white/40">
            {mandateName} mandate — cost analysis complete
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="rounded-md border border-white/10 bg-[#121212] p-4 mb-4 divide-y divide-white/5">
        <MetricRow label="Route cost" value={`$${analysis.routeCostUsd.toFixed(2)}`}
          highlight={analysis.routeCostUsd < 1 ? 'accent' : analysis.routeCostUsd > 5 ? 'muted' : undefined} />
        {analysis.gasCostUsd > 0 && (
          <MetricRow label="  Gas" value={`$${analysis.gasCostUsd.toFixed(2)}`} />
        )}
        {analysis.feeCostUsd > 0 && (
          <MetricRow label="  Fees" value={`$${analysis.feeCostUsd.toFixed(2)}`} />
        )}
        <MetricRow label="APY uplift" value={`+${analysis.apyDeltaPct.toFixed(2)}%`}
          highlight={analysis.apyDeltaPct > 0 ? 'accent' : 'muted'} />
        <MetricRow label="Extra annual yield" value={`$${analysis.annualYieldUpliftUsd.toFixed(2)}`}
          highlight={analysis.annualYieldUpliftUsd > 10 ? 'accent' : undefined} />
        <MetricRow
          label="Break-even"
          value={analysis.breakEvenDays !== null ? `${analysis.breakEvenDays.toFixed(1)} days` : 'N/A'}
          highlight={
            analysis.breakEvenDays === null ? 'muted'
            : analysis.breakEvenDays <= analysis.mandateMaxBreakEven ? 'accent'
            : 'muted'
          }
        />
        <MetricRow label="Mandate limit" value={`${analysis.mandateMaxBreakEven} days`} />
      </div>

      {/* Reasons */}
      <div className="space-y-2 mb-4">
        {analysis.reasons.map((reason, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 py-2 px-3 rounded-lg border ${
              isApproved
                ? 'bg-[#00d4aa]/5 border-[#00d4aa]/10'
                : 'bg-[#1a1a1a] border-white/10'
            }`}
          >
            <span className={`text-sm mt-0.5 ${isApproved ? 'text-[#00d4aa]' : 'text-white/60'}`}>
              {isApproved ? '+' : '!'}
            </span>
            <p className="text-sm text-white/65">{reason}</p>
          </div>
        ))}
      </div>

      {/* Action */}
      {isApproved && onExecute && (
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="w-full rounded-md bg-[#00d4aa] py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        >
          {isExecuting ? actionLabel || 'Executing...' : 'Execute move'}
        </button>
      )}

      {!isApproved && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-xs text-white/35">
            Your funds stay put. This is your mandate protecting your capital.
          </p>
        </div>
      )}
    </div>
  )
}
