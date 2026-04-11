'use client'

import { MANDATES, type MandateKey } from '@/lib/mandates'
import { Check, Scale, ShieldCheck, Zap } from 'lucide-react'

const ICONS = {
  conservative: ShieldCheck,
  balanced: Scale,
  aggressive: Zap,
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

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`group rounded-md border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-[#00d4aa]/50 bg-[#121212] shadow-[0_0_32px_rgba(0,212,170,0.08)]'
                  : 'border-white/10 bg-[#121212] hover:border-[#00d4aa]/40'
              }`}
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className={isSelected ? 'text-[#00d4aa]' : 'text-white/45 group-hover:text-[#00d4aa]'}>
                  <IconComp size={21} strokeWidth={1.7} />
                </div>
                {isSelected && (
                  <span className="rounded-full border border-[#00d4aa]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00d4aa]">
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
                      <Check size={13} strokeWidth={1.8} className="text-[#00d4aa]" />
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
