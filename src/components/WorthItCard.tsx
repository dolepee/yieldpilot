'use client'

import type { WorthItAnalysis } from '@/lib/worth-it'

interface WorthItCardProps {
  analysis: WorthItAnalysis
  mandateName: string
  onExecute?: () => void
  isExecuting?: boolean
  actionLabel?: string
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' | 'yellow' }) {
  const colorClass = highlight === 'green' ? 'text-green-400'
    : highlight === 'red' ? 'text-red-400'
    : highlight === 'yellow' ? 'text-yellow-400'
    : 'text-white'

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
    </div>
  )
}

export function WorthItCard({ analysis, mandateName, onExecute, isExecuting, actionLabel }: WorthItCardProps) {
  const isApproved = analysis.verdict === 'approved'

  return (
    <div className={`card p-6 ${isApproved ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isApproved ? 'bg-green-500/10' : 'bg-yellow-500/10'
        }`}>
          {isApproved ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {isApproved ? 'Move approved' : 'Move not worth it'}
          </h3>
          <p className="text-sm text-gray-500">
            {mandateName} mandate — cost analysis complete
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="rounded-lg bg-white/[0.02] p-4 mb-4 divide-y divide-white/5">
        <MetricRow label="Route cost" value={`$${analysis.routeCostUsd.toFixed(2)}`}
          highlight={analysis.routeCostUsd < 1 ? 'green' : analysis.routeCostUsd > 5 ? 'red' : undefined} />
        {analysis.gasCostUsd > 0 && (
          <MetricRow label="  Gas" value={`$${analysis.gasCostUsd.toFixed(2)}`} />
        )}
        {analysis.feeCostUsd > 0 && (
          <MetricRow label="  Fees" value={`$${analysis.feeCostUsd.toFixed(2)}`} />
        )}
        <MetricRow label="APY uplift" value={`+${analysis.apyDeltaPct.toFixed(2)}%`}
          highlight={analysis.apyDeltaPct > 1 ? 'green' : analysis.apyDeltaPct > 0 ? 'yellow' : 'red'} />
        <MetricRow label="Extra annual yield" value={`$${analysis.annualYieldUpliftUsd.toFixed(2)}`}
          highlight={analysis.annualYieldUpliftUsd > 10 ? 'green' : undefined} />
        <MetricRow
          label="Break-even"
          value={analysis.breakEvenDays !== null ? `${analysis.breakEvenDays.toFixed(1)} days` : 'N/A'}
          highlight={
            analysis.breakEvenDays === null ? 'red'
            : analysis.breakEvenDays <= analysis.mandateMaxBreakEven ? 'green'
            : 'red'
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
                ? 'bg-green-500/5 border-green-500/10'
                : 'bg-yellow-500/5 border-yellow-500/10'
            }`}
          >
            <span className={`text-sm mt-0.5 ${isApproved ? 'text-green-400' : 'text-yellow-400'}`}>
              {isApproved ? '+' : '!'}
            </span>
            <p className="text-sm text-gray-300">{reason}</p>
          </div>
        ))}
      </div>

      {/* Action */}
      {isApproved && onExecute && (
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isExecuting ? actionLabel || 'Executing...' : 'Execute move'}
        </button>
      )}

      {!isApproved && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-xs text-gray-600">
            Your funds stay put. This is your mandate protecting your capital.
          </p>
        </div>
      )}
    </div>
  )
}
