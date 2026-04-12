import type { Vault } from './earn-api'

export const LEGACY_EARN_VAULTS: Vault[] = [
  {
    name: 'Steakhouse USDC',
    slug: '8453-0xbeef010f9cb27031ad51e3333f9af9c6b1228183',
    tags: ['stablecoin', 'single'],
    address: '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183',
    chainId: 8453,
    network: 'Base',
    description: 'Steakhouse USDC legacy Morpho vault used by earlier LI.FI Earn routes.',
    protocol: {
      name: 'morpho-v1',
      url: 'https://app.morpho.org/base/vault/0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183',
    },
    underlyingTokens: [
      {
        symbol: 'USDC',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        decimals: 6,
      },
    ],
    analytics: {
      apy: { base: 0, total: 0, reward: 0 },
      apy1d: null,
      apy7d: null,
      apy30d: null,
      tvl: { usd: '0' },
      updatedAt: new Date(0).toISOString(),
    },
    isTransactional: true,
    isRedeemable: true,
    depositPacks: [],
    redeemPacks: [{ name: 'direct-erc4626', stepsType: 'instant' }],
  },
]
