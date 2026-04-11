import type { MandateConfig, MandateKey } from './mandates'
import { MANDATES } from './mandates'

const ALLOWED_CHAINS = ['ethereum', 'base', 'arbitrum', 'optimism'] as const

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
  minVaultApyPct?: number
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isPresetKey(value: unknown): value is MandateKey {
  return value === 'conservative' || value === 'balanced' || value === 'aggressive'
}

function fallbackReasoning(preset: MandateKey, crossChainAllowed: boolean, minTvlUsd: number, maxBreakEvenDays: number) {
  return [
    `Parsed your request as a ${preset} strategy.`,
    crossChainAllowed ? 'Cross-chain routes are allowed.' : 'Same-chain execution is preferred or required.',
    `Minimum TVL threshold set to $${Math.round(minTvlUsd).toLocaleString()}.`,
    `Break-even ceiling set to ${maxBreakEvenDays} days.`,
  ]
}

function applyExplicitPromptFloors(payload: ParsedIntentPayload, prompt: string): ParsedIntentPayload {
  const explicitTvl = parseMoneyThreshold(prompt)
  const explicitApy = parseMinApy(prompt)
  const lower = prompt.toLowerCase()
  const explicitChains = detectPreferredChains(prompt)
  const forbidsBridge = /(same[- ]chain|no bridge|without bridge|do not bridge|don't bridge|stay on|keep it on)/.test(lower)
  const chainOnly = explicitChains.length > 0 && /\bonly\b/.test(lower)
  const requestsCrossChain = /(cross[- ]?chain|any chain|wherever|best chain|needs? a bridge)/.test(lower)
    || (/\bbridge\b/.test(lower) && !forbidsBridge)
  const requestsMatureProtocols = hasMatureProtocolIntent(prompt)
  const avoidsRewards = hasRewardAvoidanceIntent(prompt)
  const payloadProtocolTier = Number.isFinite(payload.protocolTierFloor) ? payload.protocolTierFloor : 0

  return {
    ...payload,
    avoidRewardHeavy: avoidsRewards ? true : payload.avoidRewardHeavy,
    crossChainAllowed: forbidsBridge || chainOnly ? false : requestsCrossChain ? true : payload.crossChainAllowed,
    sameChainPreferred: forbidsBridge || chainOnly ? true : requestsCrossChain ? false : payload.sameChainPreferred,
    minTvlUsd: explicitTvl !== null ? explicitTvl : payload.minTvlUsd,
    minVaultApyPct: explicitApy !== null ? explicitApy : payload.minVaultApyPct,
    protocolTierFloor: requestsMatureProtocols ? Math.max(payloadProtocolTier, 8) : payload.protocolTierFloor,
    preferredChains: explicitChains.length > 0 ? explicitChains : payload.preferredChains,
  }
}

export function normalizeParsedIntent(
  payload: ParsedIntentPayload,
  balances: IntentBalanceSummary[],
  prompt = ''
): ParsedIntentPayload {
  const adjustedPayload = applyExplicitPromptFloors(payload, prompt)
  const suggestedPreset = isPresetKey(adjustedPayload.suggestedPreset) ? adjustedPayload.suggestedPreset : 'balanced'
  const baseMandate = MANDATES[suggestedPreset]
  const heldChains = [...new Set(balances.map((balance) => balance.chainName.toLowerCase()))]
  const explicitBreakEvenDays = parseBreakEvenDays(prompt)
  const explicitApyImprovementPct = parseApyImprovement(prompt)
  const explicitPreferredChains = detectPreferredChains(prompt)
  const requestsMatureProtocols = hasMatureProtocolIntent(prompt)
  const avoidsRewards = hasRewardAvoidanceIntent(prompt)

  const sameChainPreferred = typeof adjustedPayload.sameChainPreferred === 'boolean'
    ? adjustedPayload.sameChainPreferred
    : baseMandate.sameChainPreferred
  const crossChainAllowed = typeof adjustedPayload.crossChainAllowed === 'boolean'
    ? adjustedPayload.crossChainAllowed
    : baseMandate.crossChainAllowed
  const avoidRewardHeavy = avoidsRewards ? true : baseMandate.avoidRewardHeavy

  const minTvlUsd = Number.isFinite(adjustedPayload.minTvlUsd) && adjustedPayload.minTvlUsd > 0
    ? clamp(Math.round(adjustedPayload.minTvlUsd), 1_000_000, 10_000_000_000)
    : baseMandate.minTvlUsd
  const minVaultApyPct = Number.isFinite(adjustedPayload.minVaultApyPct)
    ? clamp(Number(adjustedPayload.minVaultApyPct), 0, 100)
    : baseMandate.minVaultApyPct ?? 0
  const maxBreakEvenDays = explicitBreakEvenDays !== null
    ? clamp(Math.round(explicitBreakEvenDays), 3, 45)
    : baseMandate.maxBreakEvenDays
  const minApyImprovementPct = explicitApyImprovementPct !== null
    ? clamp(explicitApyImprovementPct, 0.25, 10)
    : baseMandate.minApyImprovementBps / 100
  const protocolTierFloor = requestsMatureProtocols
    ? Math.max(
        Number.isFinite(adjustedPayload.protocolTierFloor)
          ? clamp(Math.round(adjustedPayload.protocolTierFloor), 3, 10)
          : baseMandate.protocolTierFloor,
        8
      )
    : baseMandate.protocolTierFloor

  const normalizedPreferredChains = explicitPreferredChains.length > 0
    ? explicitPreferredChains
    : sameChainPreferred
      ? heldChains.filter((chain): chain is (typeof ALLOWED_CHAINS)[number] =>
          (ALLOWED_CHAINS as readonly string[]).includes(chain)
        )
      : []

  const reasoning = Array.isArray(adjustedPayload.reasoning)
    ? adjustedPayload.reasoning
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 4)
    : []

  return {
    strategyName: String(adjustedPayload.strategyName || '').trim() || baseMandate.name,
    summary: String(adjustedPayload.summary || '').trim() || baseMandate.description,
    suggestedPreset,
    crossChainAllowed: sameChainPreferred ? false : crossChainAllowed,
    sameChainPreferred,
    avoidRewardHeavy,
    minTvlUsd,
    minVaultApyPct,
    maxBreakEvenDays,
    minApyImprovementPct,
    protocolTierFloor,
    preferredChains: normalizedPreferredChains,
    reasoning: reasoning.length > 0
      ? reasoning
      : fallbackReasoning(suggestedPreset, sameChainPreferred ? false : crossChainAllowed, minTvlUsd, maxBreakEvenDays),
  }
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
      minVaultApyPct: payload.minVaultApyPct,
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

function parseApyImprovement(input: string): number | null {
  const match = input.match(/(?:uplift|improvement|improve|better|delta).{0,20}?(\d+(?:\.\d+)?)\s*%/i)
    || input.match(/(\d+(?:\.\d+)?)\s*%.{0,20}?(?:uplift|improvement|improve|better|delta)/i)
  return match ? Number(match[1]) : null
}

function hasMatureProtocolIntent(input: string): boolean {
  return /(only top|battle tested|blue[- ]?chip|mature protocol|mature protocols)/i.test(input)
}

function hasRewardAvoidanceIntent(input: string): boolean {
  return /(organic|real yield|no rewards|avoid rewards|avoid incentive|not reward heavy|no reward-heavy)/i.test(input)
}

function detectPreferredChains(input: string): string[] {
  const lower = input.toLowerCase()
  return ALLOWED_CHAINS.filter(chain => lower.includes(chain))
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
  const forbidsBridge = /(same[- ]chain|no bridge|without bridge|do not bridge|don't bridge|stay on|keep it on)/.test(lower)
  const requestsCrossChain = /(cross[- ]?chain|any chain|wherever|best chain)/.test(lower)
    || (/\bbridge\b/.test(lower) && !forbidsBridge)

  const crossChainAllowed = forbidsBridge
    ? false
    : requestsCrossChain
      ? true
      : baseMandate.crossChainAllowed

  const sameChainPreferred = forbidsBridge
    ? true
    : requestsCrossChain
      ? false
    : baseMandate.sameChainPreferred

  const avoidRewardHeavy = /(organic|real yield|no rewards|avoid rewards|avoid incentive|not reward heavy)/.test(lower)
    ? true
    : baseMandate.avoidRewardHeavy

  const minTvlUsd = parseMoneyThreshold(text) ?? baseMandate.minTvlUsd
  const minVaultApyPct = parseMinApy(text) ?? baseMandate.minVaultApyPct ?? 0
  const maxBreakEvenDays = parseBreakEvenDays(text) ?? baseMandate.maxBreakEvenDays
  const minApyImprovementPct = parseApyImprovement(text) ?? baseMandate.minApyImprovementBps / 100
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

  return makeIntentPlan(
    normalizeParsedIntent(
      {
        strategyName,
        summary,
        suggestedPreset: preset,
        crossChainAllowed,
        sameChainPreferred,
        avoidRewardHeavy,
        minTvlUsd,
        minVaultApyPct,
        maxBreakEvenDays,
        minApyImprovementPct,
        protocolTierFloor,
        preferredChains,
        reasoning: fallbackReasoning(preset, crossChainAllowed, minTvlUsd, maxBreakEvenDays),
      },
      balances,
      prompt
    ),
    prompt,
    'fallback'
  )
}
