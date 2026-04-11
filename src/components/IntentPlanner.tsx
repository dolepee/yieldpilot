'use client'

import type { IntentPlan } from '@/lib/intent'
import { Check, Terminal } from 'lucide-react'

const EXAMPLES = [
  'Find highest yield > 5% on Base with TVL above $50M.',
  'Stay same-chain and refuse routes with break-even above 7 days.',
  'Use mature protocols only and avoid reward-heavy farms.',
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
    <div className="card p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Agentic Input Terminal</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Execution Mandate</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Natural language is compiled into deterministic constraints before any vault ranking or route quote.
          </p>
        </div>
        {plan && (
          <button
            onClick={onUsePreset}
            className="text-xs text-white/40 transition-colors hover:text-[#00d4aa]"
          >
            Use preset instead
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-md border border-white/10 bg-[#0a0a0a] transition-shadow focus-within:focus-teal">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/40">
            <Terminal size={15} strokeWidth={1.6} className="text-[#00d4aa]" />
            <span>Execution Mandate (Natural Language)</span>
          </div>
          <div className="flex items-start gap-3 p-4">
            <span className="font-mono text-sm text-[#00d4aa]">$</span>
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              rows={3}
              disabled={disabled || isLoading}
              placeholder="compile --yield 'USDC above 5%, TVL > $50M, bridge allowed only if route economics pass'"
              className="min-h-24 w-full resize-none bg-transparent font-mono text-sm leading-6 text-white outline-none placeholder:text-white/25 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onPromptChange(example)}
              disabled={disabled || isLoading}
              className="text-left font-mono text-xs text-white/35 transition-colors hover:text-[#00d4aa] disabled:opacity-40"
            >
              {`> ${example}`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={onAnalyze}
            disabled={disabled || isLoading || !prompt.trim()}
            className="rounded-md bg-[#00d4aa] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
          >
            {isLoading ? 'Compiling...' : 'Compile Mandate'}
          </button>
          <p className="text-xs text-white/35">Powered by Bankr LLM; final ranking stays deterministic.</p>
        </div>

        {error && (
          <div className="rounded-md border border-white/10 bg-[#1a1a1a] px-4 py-3">
            <p className="font-mono text-sm text-white/70">{error}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-5 rounded-md border border-[#00d4aa]/20 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[#00d4aa]">
                  {plan.source === 'ai' ? 'AI-generated mandate' : 'Fallback-generated mandate'}
                </p>
                <h3 className="text-base font-semibold text-white">{plan.title}</h3>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-white/50">
                maps closest to {plan.suggestedPreset}
              </span>
            </div>

            <p className="text-sm text-white/60">{plan.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-white/10 bg-[#121212] p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">TVL floor</p>
                <p className="font-mono text-sm font-medium text-white">
                  ${plan.mandate.minTvlUsd >= 1_000_000
                    ? `${(plan.mandate.minTvlUsd / 1_000_000).toFixed(0)}M`
                    : `${(plan.mandate.minTvlUsd / 1_000).toFixed(0)}K`}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-[#121212] p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">Min vault APY</p>
                <p className="font-mono text-sm font-medium text-white">
                  {(plan.mandate.minVaultApyPct ?? 0) > 0
                    ? `${(plan.mandate.minVaultApyPct ?? 0).toFixed(2)}%`
                    : 'Any'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-[#121212] p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">Break-even limit</p>
                <p className="font-mono text-sm font-medium text-white">{plan.mandate.maxBreakEvenDays} days</p>
              </div>
              <div className="rounded-md border border-white/10 bg-[#121212] p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">Cross-chain</p>
                <p className="font-mono text-sm font-medium text-white">
                  {plan.mandate.crossChainAllowed ? 'Allowed' : 'Same-chain only'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Why the AI chose this</p>
              <div className="space-y-2">
                {plan.reasoning.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Check size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#00d4aa]" />
                    <p className="text-sm text-white/60">{item}</p>
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
