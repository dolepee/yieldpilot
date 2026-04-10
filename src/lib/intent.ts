import type { MandateConfig, MandateKey } from './mandates'
import { MANDATES } from './mandates'

export interface IntentBalanceSummary {
  chainId: number
  chainName: string
  token: 'USDC' | 'USDT'
  formatted: string
  usdValue: number
}

export interface ParsedIntentPayload {
  strategyName: string
  summary: string
  suggestedPreset: MandateKey
  crossChainAllowed: boolean
  sameChainPreferred: boolean
  avoidRewardHeavy: boolean
  minTvlUsd: number
  maxBreakEvenDays: number
  minApyImprovementPct: number
  protocolTierFloor: number
  preferredChains: string[]
  reasoning: string[]
}

export interface IntentPlan {
  source: 'ai' | 'fallback'
  prompt: string
  title: string
  summary: string
  suggestedPreset: MandateKey
  mandate: MandateConfig
  preferredChains: string[]
  reasoning: string[]
}

export function makeIntentPlan(
  payload: ParsedIntentPayload,
  prompt: string,
  source: 'ai' | 'fallback'
): IntentPlan {
  return {
    source,
    prompt,
    title: payload.strategyName,
    summary: payload.summary,
    suggestedPreset: payload.suggestedPreset,
    preferredChains: payload.preferredChains,
    reasoning: payload.reasoning.slice(0, 4),
    mandate: {
      name: payload.strategyName,
      description: payload.summary,
      stablecoinsOnly: true,
      sameChainPreferred: payload.sameChainPreferred,
      crossChainAllowed: payload.crossChainAllowed,
      minTvlUsd: payload.minTvlUsd,
      minApyImprovementBps: Math.round(payload.minApyImprovementPct * 100),
      maxBreakEvenDays: payload.maxBreakEvenDays,
      avoidRewardHeavy: payload.avoidRewardHeavy,
      protocolTierFloor: payload.protocolTierFloor,
    },
  }
}

function parseMoneyThreshold(input: string): number | null {
  const match = input.match(/(?:tvl|liquidity|vaults?|protocols?).{0,30}?(?:above|over|at least|min(?:imum)? of?)\s*\$?\s*(\d+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion)?/i)
    || input.match(/\$?\s*(\d+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion)\s*(?:tvl|liquidity)/i)

  if (!match) return null

  const value = Number(match[1])
  const unit = match[2]?.toLowerCase()
  if (!unit) return value
  if (unit === 'k' || unit === 'thousand') return value * 1_000
  if (unit === 'm' || unit === 'million') return value * 1_000_000
  if (unit === 'b' || unit === 'billion') return value * 1_000_000_000
  return value
}

function parseBreakEvenDays(input: string): number | null {
  const match = input.match(/(?:break(?:-| )?even|pay(?:back)?|recover).{0,20}?(\d+)\s*days?/i)
    || input.match(/(\d+)\s*days?.{0,20}?(?:max|maximum|or less|tops|at most)/i)

  return match ? Number(match[1]) : null
}

function parseMinApy(input: string): number | null {
  const match = input.match(/(?:above|over|at least|min(?:imum)? of?)\s*(\d+(?:\.\d+)?)\s*%/i)
  return match ? Number(match[1]) : null
}

function detectPreferredChains(input: string): string[] {
  const lower = input.toLowerCase()
  const known = ['ethereum', 'base', 'arbitrum', 'optimism']
  return known.filter(chain => lower.includes(chain))
}

export function fallbackParseIntent(prompt: string, balances: IntentBalanceSummary[]): IntentPlan {
  const text = prompt.trim()
  const lower = text.toLowerCase()

  let preset: MandateKey = 'balanced'
  if (/(safe|safest|conservative|protect|preserve|no risk|low risk|grandma)/.test(lower)) {
    preset = 'conservative'
  } else if (/(aggressive|max yield|highest yield|degen|juice|risk-on|chase)/.test(lower)) {
    preset = 'aggressive'
  }

  const baseMandate = MANDATES[preset]
  const crossChainAllowed = /(cross[- ]?chain|any chain|bridge|wherever|best chain)/.test(lower)
    ? true
    : /(same chain|no bridge|without bridge|stay on|keep it on)/.test(lower)
      ? false
      : baseMandate.crossChainAllowed

  const sameChainPreferred = /(same chain|no bridge|without bridge|stay on|keep it on)/.test(lower)
    ? true
    : baseMandate.sameChainPreferred

  const avoidRewardHeavy = /(organic|real yield|no rewards|avoid rewards|avoid incentive|not reward heavy)/.test(lower)
    ? true
    : baseMandate.avoidRewardHeavy

  const minTvlUsd = parseMoneyThreshold(text) ?? baseMandate.minTvlUsd
  const maxBreakEvenDays = parseBreakEvenDays(text) ?? baseMandate.maxBreakEvenDays
  const minApyImprovementPct = parseMinApy(text) ?? baseMandate.minApyImprovementBps / 100
  const preferredChains = detectPreferredChains(text)
  const protocolTierFloor = /(only top|battle tested|blue chip|mature protocol)/.test(lower)
    ? Math.max(baseMandate.protocolTierFloor, 8)
    : baseMandate.protocolTierFloor

  const heldChains = [...new Set(balances.map(balance => balance.chainName))]
  const chainLine = preferredChains.length > 0
    ? preferredChains.join(', ')
    : heldChains.length > 0
      ? heldChains.join(', ')
      : 'your current chains'

  const strategyName =
    preset === 'conservative'
      ? 'AI Safety-First Mandate'
      : preset === 'aggressive'
        ? 'AI Yield-Max Mandate'
        : 'AI Balanced Mandate'

  const summary =
    preset === 'conservative'
      ? `Stay near the safest stablecoin vaults on ${chainLine}, avoid reward-heavy yields, and only move when route costs recover quickly.`
      : preset === 'aggressive'
        ? `Search widely across ${chainLine} for stronger APY, allow more route flexibility, and accept longer break-even if the upside is real.`
        : `Prefer practical yield on ${chainLine}, allow cross-chain when it clearly pays for itself, and keep liquidity quality high.`

  const reasoning = [
    `Parsed your request as a ${preset} strategy.`,
    crossChainAllowed ? 'Cross-chain routes are allowed.' : 'Same-chain execution is preferred or required.',
    `Minimum TVL threshold set to $${Math.round(minTvlUsd).toLocaleString()}.`,
    `Break-even ceiling set to ${maxBreakEvenDays} days.`,
  ]

  return makeIntentPlan(
    {
      strategyName,
      summary,
      suggestedPreset: preset,
      crossChainAllowed,
      sameChainPreferred,
      avoidRewardHeavy,
      minTvlUsd,
      maxBreakEvenDays,
      minApyImprovementPct,
      protocolTierFloor,
      preferredChains,
      reasoning,
    },
    prompt,
    'fallback'
  )
}
