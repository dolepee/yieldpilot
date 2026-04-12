import { mainnet, base, arbitrum, optimism } from 'wagmi/chains'

export const TARGET_CHAINS = [mainnet, base, arbitrum, optimism] as const

export const CHAIN_META: Record<number, { name: string; logo: string; color: string; explorer: string }> = {
  [mainnet.id]: { name: 'Ethereum', logo: '/chains/ethereum.svg', color: '#627EEA', explorer: 'https://etherscan.io' },
  [base.id]: { name: 'Base', logo: '/chains/base.svg', color: '#0052FF', explorer: 'https://basescan.org' },
  [arbitrum.id]: { name: 'Arbitrum', logo: '/chains/arbitrum.svg', color: '#28A0F0', explorer: 'https://arbiscan.io' },
  [optimism.id]: { name: 'Optimism', logo: '/chains/optimism.svg', color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
}

// Stablecoin contract addresses per chain
export const STABLECOINS: Record<number, { usdc: `0x${string}` | null; usdt: `0x${string}` | null }> = {
  [mainnet.id]: {
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  [base.id]: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    usdt: null, // no native USDT on Base
  },
  [arbitrum.id]: {
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  [optimism.id]: {
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
}

export const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

export const ERC20_ALLOWANCE_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export const ERC4626_VAULT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
] as const

export const EARN_API_BASE = 'https://earn.li.fi'
export const COMPOSER_API_BASE = 'https://li.quest'

// Protocol maturity tiers for ranking
export const PROTOCOL_TIERS: Record<string, number> = {
  'aave-v3': 10,
  'morpho-v1': 9,
  'euler-v2': 8,
  'maple': 7,
  'pendle': 7,
  'ether.fi-stake': 7,
  'ether.fi-liquid': 7,
  'ethena-usde': 6,
  'upshift': 5,
  'yo-protocol': 5,
  'neverland': 4,
}
