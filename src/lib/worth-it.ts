import type { ComposerQuote } from './composer'
import type { MandateConfig } from './mandates'
import type { ScoredVault } from './ranking'
import { extractRouteCost } from './composer'

export interface WorthItAnalysis {
  verdict: 'approved' | 'refused'
  routeCostUsd: number
  gasCostUsd: number
  feeCostUsd: number
  amountUsd: number
  currentApy: number // 0 for idle
  newApy: number
  apyDeltaPct: number
  annualYieldUpliftUsd: number
  dailyYieldUpliftUsd: number
  breakEvenDays: number | null // null if no improvement
  mandateMaxBreakEven: number
  reasons: string[]
}

export function analyzeWorthIt(
  quote: ComposerQuote,
  scored: ScoredVault,
  mandate: MandateConfig,
  currentApy: number = 0 // idle = 0%
): WorthItAnalysis {
  const { gasCostUsd, feeCostUsd, totalCostUsd } = extractRouteCost(quote)
  const amountUsd = scored.matchedBalance.usdValue
  const newApy = scored.vault.analytics.apy.total
  const apyDeltaPct = newApy - currentApy

  // Calculate yield improvement
  const annualYieldUpliftUsd = amountUsd * (apyDeltaPct / 100)
  const dailyYieldUpliftUsd = annualYieldUpliftUsd / 365

  // Break-even calculation
  let breakEvenDays: number | null = null
  if (dailyYieldUpliftUsd > 0) {
    breakEvenDays = totalCostUsd / dailyYieldUpliftUsd
  }

  const reasons: string[] = []
  let verdict: 'approved' | 'refused' = 'approved'

  // Check: APY delta must be positive
  if (apyDeltaPct <= 0) {
    verdict = 'refused'
    reasons.push(`No APY improvement. Current: ${currentApy.toFixed(2)}%, available: ${newApy.toFixed(2)}%.`)
  }

  // Check: minimum APY improvement per mandate
  if (apyDeltaPct * 100 < mandate.minApyImprovementBps) {
    verdict = 'refused'
    reasons.push(
      `APY improvement of ${apyDeltaPct.toFixed(2)}% is below your mandate minimum of ${(mandate.minApyImprovementBps / 100).toFixed(1)}%.`
    )
  }

  // Check: break-even within mandate threshold
  if (breakEvenDays !== null && breakEvenDays > mandate.maxBreakEvenDays) {
    verdict = 'refused'
    reasons.push(
      `Route cost of $${totalCostUsd.toFixed(2)} takes ${breakEvenDays.toFixed(1)} days to recover. Your mandate allows ${mandate.maxBreakEvenDays} days max.`
    )
  }

  // Check: break-even impossible (no yield improvement)
  if (breakEvenDays === null && totalCostUsd > 0) {
    verdict = 'refused'
    reasons.push(`Route has a cost of $${totalCostUsd.toFixed(2)} but no yield improvement to recover it.`)
  }

  // Check: route cost exceeds 5% of amount (sanity check)
  if (totalCostUsd > amountUsd * 0.05) {
    verdict = 'refused'
    reasons.push(
      `Route cost of $${totalCostUsd.toFixed(2)} is ${((totalCostUsd / amountUsd) * 100).toFixed(1)}% of your deposit. Too expensive.`
    )
  }

  // If approved, add positive reasons
  if (verdict === 'approved') {
    if (breakEvenDays !== null) {
      reasons.push(`Route cost recovers in ${breakEvenDays.toFixed(1)} days (mandate allows ${mandate.maxBreakEvenDays}).`)
    }
    reasons.push(`APY uplift: ${apyDeltaPct.toFixed(2)}%, adding ~$${annualYieldUpliftUsd.toFixed(2)}/year.`)
    if (totalCostUsd < 1) {
      reasons.push('Minimal route cost.')
    }
  }

  return {
    verdict,
    routeCostUsd: totalCostUsd,
    gasCostUsd,
    feeCostUsd,
    amountUsd,
    currentApy,
    newApy,
    apyDeltaPct,
    annualYieldUpliftUsd,
    dailyYieldUpliftUsd,
    breakEvenDays,
    mandateMaxBreakEven: mandate.maxBreakEvenDays,
    reasons,
  }
}
