import type { Vault } from './earn-api'
import type { MandateConfig } from './mandates'
import type { TokenBalance } from '@/hooks/useStablecoinBalances'
import { PROTOCOL_TIERS } from './constants'

export interface ScoredVault {
  vault: Vault
  score: number
  apyScore: number
  stabilityScore: number
  tvlScore: number
  protocolScore: number
  sameChainBonus: number
  matchedBalance: TokenBalance
  apyDelta: number // vs idle (0%)
  reasons: string[] // why this vault won
  failedChecks: string[] // mandate checks that eliminated other vaults
}

export interface RecommendationResult {
  type: 'recommended' | 'refused'
  top: ScoredVault | null
  refusalReasons: string[]
  candidatesScanned: number
  candidatesFiltered: number
}

// Filter vaults by mandate constraints
function filterByMandate(
  vaults: Vault[],
  mandate: MandateConfig,
  userBalances: TokenBalance[]
): { passed: Vault[]; reasons: string[] } {
  const reasons: string[] = []
  const userChainIds = new Set(userBalances.map(b => b.chainId))

  const passed = vaults.filter(vault => {
    // Must be depositable
    if (!vault.isTransactional) return false

    // Stablecoins only
    if (mandate.stablecoinsOnly && !vault.tags.includes('stablecoin')) return false

    // Chain rules
    if (!mandate.crossChainAllowed) {
      if (!userChainIds.has(vault.chainId)) return false
    }

    // TVL floor
    const tvl = Number(vault.analytics.tvl.usd)
    if (tvl < mandate.minTvlUsd) return false

    // Protocol maturity
    const tier = PROTOCOL_TIERS[vault.protocol.name] ?? 3
    if (tier < mandate.protocolTierFloor) return false

    // Reward-heavy exclusion
    if (mandate.avoidRewardHeavy) {
      const apy = vault.analytics.apy
      if (apy.reward && apy.base > 0 && apy.reward > apy.base * 1.5) return false
    }

    // Must have a matching underlying stablecoin the user holds
    const hasMatchingToken = vault.underlyingTokens.some(ut => {
      const sym = ut.symbol.toUpperCase()
      return userBalances.some(b => b.token === sym)
    })
    if (!hasMatchingToken) return false

    return true
  })

  if (passed.length === 0) {
    if (!mandate.crossChainAllowed) reasons.push('No same-chain vaults meet your mandate. Cross-chain is not allowed under this mandate.')
    if (mandate.minTvlUsd >= 100_000_000) reasons.push(`No vaults with TVL above $${(mandate.minTvlUsd / 1_000_000).toFixed(0)}M match your criteria.`)
    if (mandate.protocolTierFloor >= 8) reasons.push('Only top-tier protocols allowed. No compliant vaults found.')
    if (reasons.length === 0) reasons.push('No vaults satisfy all mandate constraints.')
  }

  return { passed, reasons }
}

// Score a single vault
function scoreVault(
  vault: Vault,
  mandate: MandateConfig,
  userBalances: TokenBalance[]
): ScoredVault {
  const apy = vault.analytics.apy
  const tvl = Number(vault.analytics.tvl.usd)
  const tier = PROTOCOL_TIERS[vault.protocol.name] ?? 3

  // APY score: 0-30 points
  const apyScore = Math.min(apy.total * 5, 30)

  // APY stability: 0-20 points
  // Compare 1d vs 30d — stable yields score higher
  let stabilityScore = 10 // default if no data
  if (vault.analytics.apy1d !== null && vault.analytics.apy30d !== null && vault.analytics.apy30d > 0) {
    const drift = Math.abs(vault.analytics.apy1d - vault.analytics.apy30d) / vault.analytics.apy30d
    stabilityScore = Math.max(0, 20 - drift * 40)
  }

  // TVL depth: 0-20 points
  const tvlScore = Math.min(tvl / 50_000_000, 1) * 20

  // Protocol maturity: 0-15 points
  const protocolScore = (tier / 10) * 15

  // Same-chain bonus: 0-15 points
  const userChainIds = new Set(userBalances.map(b => b.chainId))
  const isSameChain = userChainIds.has(vault.chainId)
  const sameChainBonus = isSameChain ? 15 : (mandate.sameChainPreferred ? 0 : 5)

  const score = apyScore + stabilityScore + tvlScore + protocolScore + sameChainBonus

  // Find the matching balance for this vault
  const matchedBalance = userBalances.find(b => {
    return vault.underlyingTokens.some(ut => ut.symbol.toUpperCase() === b.token) &&
      (isSameChain ? b.chainId === vault.chainId : true)
  }) || userBalances[0]

  // Build explanation
  const reasons: string[] = []
  if (apy.total > 3) reasons.push(`Strong APY at ${apy.total.toFixed(2)}%`)
  if (tvl > 100_000_000) reasons.push(`Deep liquidity ($${(tvl / 1_000_000).toFixed(0)}M TVL)`)
  if (tier >= 8) reasons.push(`Top-tier protocol (${vault.protocol.name})`)
  if (isSameChain) reasons.push('Same-chain — no bridge needed')
  if (stabilityScore > 15) reasons.push('Stable yield over 30 days')
  if (apy.reward === null || apy.reward === 0) reasons.push('Yield is organic, not incentive-driven')

  return {
    vault,
    score,
    apyScore,
    stabilityScore,
    tvlScore,
    protocolScore,
    sameChainBonus,
    matchedBalance,
    apyDelta: apy.total, // vs idle at 0%
    reasons,
    failedChecks: [],
  }
}

// Main recommendation function
export function recommend(
  vaults: Vault[],
  mandate: MandateConfig,
  userBalances: TokenBalance[]
): RecommendationResult {
  if (userBalances.length === 0) {
    return {
      type: 'refused',
      top: null,
      refusalReasons: ['No stablecoin balances detected.'],
      candidatesScanned: vaults.length,
      candidatesFiltered: 0,
    }
  }

  const { passed, reasons } = filterByMandate(vaults, mandate, userBalances)

  if (passed.length === 0) {
    return {
      type: 'refused',
      top: null,
      refusalReasons: reasons,
      candidatesScanned: vaults.length,
      candidatesFiltered: 0,
    }
  }

  // Score and rank
  const scored = passed
    .map(v => scoreVault(v, mandate, userBalances))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]

  // Check minimum APY improvement
  if (top.apyDelta * 100 < mandate.minApyImprovementBps) {
    return {
      type: 'refused',
      top,
      refusalReasons: [
        `Best available APY (${top.vault.analytics.apy.total.toFixed(2)}%) does not meet the minimum improvement threshold of ${(mandate.minApyImprovementBps / 100).toFixed(1)}%.`,
      ],
      candidatesScanned: vaults.length,
      candidatesFiltered: passed.length,
    }
  }

  return {
    type: 'recommended',
    top,
    refusalReasons: [],
    candidatesScanned: vaults.length,
    candidatesFiltered: passed.length,
  }
}
