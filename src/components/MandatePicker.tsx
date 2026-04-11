'use client'

import { MANDATES, type MandateKey } from '@/lib/mandates'

const MANDATE_ICONS: Record<string, string> = {
  conservative: 'shield',
  balanced: 'scale',
  aggressive: 'zap',
}

const MANDATE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  conservative: { border: 'border-green-500/40', bg: 'bg-green-500/5', text: 'text-green-400' },
  balanced: { border: 'border-blue-500/40', bg: 'bg-blue-500/5', text: 'text-blue-400' },
  aggressive: { border: 'border-orange-500/40', bg: 'bg-orange-500/5', text: 'text-orange-400' },
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 7l9-4 9 4M3 7l3 9h12l3-9"/>
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

const ICONS: Record<string, React.FC> = {
  shield: ShieldIcon,
  scale: ScaleIcon,
  zap: ZapIcon,
}

interface MandatePickerProps {
  selected: MandateKey | null
  onSelect: (key: MandateKey) => void
}

export function MandatePicker({ selected, onSelect }: MandatePickerProps) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Or choose a preset mandate</h2>
      <p className="text-sm text-gray-500 mb-5">
        If you do not want a custom AI-generated strategy, pick one of the fixed policy presets.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(MANDATES) as [MandateKey, typeof MANDATES[MandateKey]][]).map(([key, mandate]) => {
          const colors = MANDATE_COLORS[key]
          const isSelected = selected === key
          const IconComp = ICONS[MANDATE_ICONS[key]]

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${colors.border} ${colors.bg} ring-2 ring-white/20 shadow-lg`
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className={isSelected ? colors.text : 'text-gray-500'}>
                  {IconComp && <IconComp />}
                </div>
                {isSelected && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.border} ${colors.text}`}>
                    Active
                  </span>
                )}
              </div>
              <p className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {mandate.name}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {mandate.description}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-600">
                  TVL floor: ${mandate.minTvlUsd >= 1_000_000 ? `${(mandate.minTvlUsd / 1_000_000).toFixed(0)}M` : `${(mandate.minTvlUsd / 1_000).toFixed(0)}K`}
                </p>
                <p className="text-xs text-gray-600">
                  Break-even: under {mandate.maxBreakEvenDays} days
                </p>
                <p className="text-xs text-gray-600">
                  Cross-chain: {mandate.crossChainAllowed ? 'allowed' : 'not allowed'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
