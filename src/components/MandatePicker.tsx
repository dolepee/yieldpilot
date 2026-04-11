'use client'

import { MANDATES, type MandateKey } from '@/lib/mandates'
import { Check, Scale, ShieldCheck, Zap } from 'lucide-react'

const ICONS = {
  conservative: ShieldCheck,
  balanced: Scale,
  aggressive: Zap,
}

const CARD_STYLES: Record<MandateKey, { border: string; bg: string; text: string; hoverText: string; shadow: string }> = {
  conservative: {
    border: 'border-emerald-400/25 hover:border-emerald-300/55',
    bg: 'bg-emerald-400/[0.045]',
    text: 'text-emerald-200',
    hoverText: 'group-hover:text-emerald-200',
    shadow: 'shadow-[0_0_40px_rgba(52,211,153,0.1)]',
  },
  balanced: {
    border: 'border-cyan-400/25 hover:border-cyan-300/55',
    bg: 'bg-cyan-400/[0.045]',
    text: 'text-cyan-200',
    hoverText: 'group-hover:text-cyan-200',
    shadow: 'shadow-[0_0_40px_rgba(34,211,238,0.1)]',
  },
  aggressive: {
    border: 'border-violet-400/25 hover:border-violet-300/55',
    bg: 'bg-violet-400/[0.045]',
    text: 'text-violet-200',
    hoverText: 'group-hover:text-violet-200',
    shadow: 'shadow-[0_0_40px_rgba(139,92,246,0.11)]',
  },
}

const STRATEGY_ROWS: Record<MandateKey, { label: string; value: string }[]> = {
  conservative: [
    { label: 'Liquidity Depth', value: '> $100M' },
    { label: 'Audit Requirement', value: 'Strict' },
    { label: 'Breakeven Horizon', value: '< 7 Days' },
  ],
  balanced: [
    { label: 'Liquidity Depth', value: '> $10M' },
    { label: 'Audit Requirement', value: 'Moderate' },
    { label: 'Breakeven Horizon', value: '< 14 Days' },
  ],
  aggressive: [
    { label: 'Liquidity Depth', value: '> $1M' },
    { label: 'Audit Requirement', value: 'Flexible' },
    { label: 'Breakeven Horizon', value: '< 30 Days' },
  ],
}

interface MandatePickerProps {
  selected: MandateKey | null
  onSelect: (key: MandateKey) => void
}

export function MandatePicker({ selected, onSelect }: MandatePickerProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Deterministic Presets</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Strategy Scorecards</h2>
      </div>
      <p className="max-w-2xl text-sm text-white/45">
        Fixed policy templates for users who want deterministic constraints without natural-language compilation.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(MANDATES) as [MandateKey, typeof MANDATES[MandateKey]][]).map(([key, mandate]) => {
          const isSelected = selected === key
          const IconComp = ICONS[key]
          const style = CARD_STYLES[key]

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                isSelected
                  ? `${style.border} ${style.bg} ${style.shadow}`
                  : `border-white/10 bg-[#121212] ${style.border}`
              }`}
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className={isSelected ? style.text : `text-white/45 ${style.hoverText}`}>
                  <IconComp size={21} strokeWidth={1.7} />
                </div>
                {isSelected && (
                  <span className={`rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${style.text}`}>
                    Active
                  </span>
                )}
              </div>
              <p className="mb-5 text-base font-semibold text-white">
                {mandate.name}
              </p>
              <div className="space-y-3">
                {STRATEGY_ROWS[key].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-2">
                      <Check size={13} strokeWidth={1.8} className={style.text} />
                      <span className="text-xs text-white/45">{row.label}</span>
                    </div>
                    <span className="font-mono text-xs text-white">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span className="text-xs text-white/45">Cross-chain</span>
                  <span className="font-mono text-xs text-white">{mandate.crossChainAllowed ? 'Allowed' : 'Disabled'}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
