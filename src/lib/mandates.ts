export interface MandateConfig {
  name: string
  description: string
  stablecoinsOnly: boolean
  sameChainPreferred: boolean
  crossChainAllowed: boolean
  minTvlUsd: number
  minVaultApyPct?: number
  minApyImprovementBps: number // basis points, e.g. 150 = 1.5%
  maxBreakEvenDays: number
  avoidRewardHeavy: boolean
  protocolTierFloor: number // minimum protocol maturity tier (from constants)
}

export type MandateKey = 'conservative' | 'balanced' | 'aggressive'

export const MANDATES: Record<MandateKey, MandateConfig> = {
  conservative: {
    name: 'Conservative',
    description: 'Prioritize safety. Same-chain only, mature protocols, deep liquidity. Only move if break-even is fast.',
    stablecoinsOnly: true,
    sameChainPreferred: true,
    crossChainAllowed: false,
    minTvlUsd: 100_000_000,
    minVaultApyPct: 0,
    minApyImprovementBps: 100, // 1.0%
    maxBreakEvenDays: 7,
    avoidRewardHeavy: true,
    protocolTierFloor: 8,
  },
  balanced: {
    name: 'Balanced',
    description: 'Moderate risk tolerance. Same-chain preferred, cross-chain if the yield improvement justifies the route cost.',
    stablecoinsOnly: true,
    sameChainPreferred: true,
    crossChainAllowed: true,
    minTvlUsd: 10_000_000,
    minVaultApyPct: 0,
    minApyImprovementBps: 150, // 1.5%
    maxBreakEvenDays: 14,
    avoidRewardHeavy: false,
    protocolTierFloor: 5,
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Maximize yield. Cross-chain allowed, lower TVL thresholds, accepts incentive-heavy vaults and longer break-even.',
    stablecoinsOnly: true,
    sameChainPreferred: false,
    crossChainAllowed: true,
    minTvlUsd: 1_000_000,
    minVaultApyPct: 0,
    minApyImprovementBps: 50, // 0.5%
    maxBreakEvenDays: 30,
    avoidRewardHeavy: false,
    protocolTierFloor: 3,
  },
}
