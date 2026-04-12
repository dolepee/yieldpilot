'use client'

import type { WorthItAnalysis } from '@/lib/worth-it'

interface ScenarioSimulatorProps {
  analysis: WorthItAnalysis
}

const SCENARIOS = [10, 1_000, 100_000]

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  })
}

export function ScenarioSimulator({ analysis }: ScenarioSimulatorProps) {
  return (
    <div className="card border-amber-300/15 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Scenario Simulator</p>
          <h3 className="mt-2 text-lg font-semibold text-white">When does this route become rational?</h3>
        </div>
        <p className="max-w-sm text-xs leading-5 text-white/35">
          Same route cost, different deposit sizes. This is why tiny tests can be refused while larger wallets can pass.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {SCENARIOS.map((amount) => {
          const annualYield = amount * (analysis.apyDeltaPct / 100)
          const dailyYield = annualYield / 365
          const breakEvenDays = dailyYield > 0 ? analysis.routeCostUsd / dailyYield : null
          const passes = breakEvenDays !== null && breakEvenDays <= analysis.mandateMaxBreakEven

          return (
            <div
              key={amount}
              className={`rounded-2xl border p-4 ${
                passes
                  ? 'border-[#00d4aa]/25 bg-[#00d4aa]/10'
                  : 'border-white/10 bg-[#121212]'
              }`}
            >
              <p className="text-xs text-white/40">Deposit size</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-white">{formatUsd(amount)}</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Annual uplift</span>
                  <span className="font-mono text-white/75">+{formatUsd(annualYield)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Break-even</span>
                  <span className={`font-mono ${passes ? 'text-[#00d4aa]' : 'text-white/55'}`}>
                    {breakEvenDays !== null ? `${breakEvenDays.toFixed(1)}d` : 'n/a'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Verdict</span>
                  <span className={passes ? 'text-[#00d4aa]' : 'text-white/50'}>
                    {passes ? 'passes' : 'refuses'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
