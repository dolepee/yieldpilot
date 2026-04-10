'use client'

import type { IntentPlan } from '@/lib/intent'

const EXAMPLES = [
  'Keep me on the safest same-chain vault and do not bridge if payback is longer than 7 days.',
  'Find me the best stablecoin yield above 5% even if it needs a bridge, but keep TVL above $50M.',
  'I want conservative yield on Base only with mature protocols and no reward-heavy farms.',
]

interface IntentPlannerProps {
  prompt: string
  onPromptChange: (value: string) => void
  onAnalyze: () => void
  onUsePreset: () => void
  isLoading: boolean
  error: string | null
  plan: IntentPlan | null
  disabled?: boolean
}

export function IntentPlanner({
  prompt,
  onPromptChange,
  onAnalyze,
  onUsePreset,
  isLoading,
  error,
  plan,
  disabled,
}: IntentPlannerProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Describe your strategy in plain English</h2>
          <p className="text-sm text-gray-500">
            Let AI translate your intent into a custom mandate that actually changes the vault filter and break-even rules.
          </p>
        </div>
        {plan && (
          <button
            onClick={onUsePreset}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Use preset instead
          </button>
        )}
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={3}
          disabled={disabled || isLoading}
          placeholder="Example: Find me the safest stablecoin yield above 5% and only bridge if the route pays back in under 10 days."
          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 disabled:opacity-60"
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onPromptChange(example)}
              disabled={disabled || isLoading}
              className="text-xs px-3 py-1.5 rounded-full border border-white/8 text-gray-400 hover:border-white/15 hover:text-gray-200 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onAnalyze}
            disabled={disabled || isLoading || !prompt.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Parsing strategy...' : 'Generate AI mandate'}
          </button>
          <p className="text-xs text-gray-600">
            If no model is configured, YieldPilot falls back to a deterministic parser.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {plan && (
          <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400 mb-1">
                  {plan.source === 'ai' ? 'AI-generated mandate' : 'Fallback-generated mandate'}
                </p>
                <h3 className="text-base font-semibold text-white">{plan.title}</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300">
                maps closest to {plan.suggestedPreset}
              </span>
            </div>

            <p className="text-sm text-gray-300">{plan.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.02] p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">TVL floor</p>
                <p className="text-sm font-medium text-white">
                  ${plan.mandate.minTvlUsd >= 1_000_000
                    ? `${(plan.mandate.minTvlUsd / 1_000_000).toFixed(0)}M`
                    : `${(plan.mandate.minTvlUsd / 1_000).toFixed(0)}K`}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Break-even limit</p>
                <p className="text-sm font-medium text-white">{plan.mandate.maxBreakEvenDays} days</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Cross-chain</p>
                <p className="text-sm font-medium text-white">
                  {plan.mandate.crossChainAllowed ? 'Allowed' : 'Same-chain only'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Why the AI chose this</p>
              <div className="space-y-2">
                {plan.reasoning.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">+</span>
                    <p className="text-sm text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
