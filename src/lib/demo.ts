import type { TokenBalance } from '@/hooks/useStablecoinBalances'

// Mock balances for demo mode when wallet has no stablecoins
export const DEMO_BALANCES: TokenBalance[] = [
  {
    chainId: 8453, // Base
    chainName: 'Base',
    token: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    balance: BigInt(2500_000000),
    formatted: '2500.00',
    decimals: 6,
    usdValue: 2500,
  },
  {
    chainId: 1, // Ethereum
    chainName: 'Ethereum',
    token: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    balance: BigInt(1000_000000),
    formatted: '1000.00',
    decimals: 6,
    usdValue: 1000,
  },
  {
    chainId: 42161, // Arbitrum
    chainName: 'Arbitrum One',
    token: 'USDT',
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    balance: BigInt(500_000000),
    formatted: '500.00',
    decimals: 6,
    usdValue: 500,
  },
]

export const DEMO_TOTAL_USD = DEMO_BALANCES.reduce((sum, b) => sum + b.usdValue, 0)
