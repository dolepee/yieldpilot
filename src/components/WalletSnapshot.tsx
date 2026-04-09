'use client'

import { useStablecoinBalances, type TokenBalance } from '@/hooks/useStablecoinBalances'
import { CHAIN_META } from '@/lib/constants'

function ChainBalanceRow({ balance }: { balance: TokenBalance }) {
  const meta = CHAIN_META[balance.chainId]
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: meta?.color || '#666' }}
        >
          {meta?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{balance.token}</p>
          <p className="text-xs text-gray-500">{meta?.name || `Chain ${balance.chainId}`}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          ${Number(balance.formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}

interface WalletSnapshotProps {
  address: `0x${string}`
  onDemoMode?: () => void
}

export function WalletSnapshot({ address, onDemoMode }: WalletSnapshotProps) {
  const { balances, totalUsd, isLoading, error } = useStablecoinBalances(address)

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Scanning stablecoin balances across 4 chains...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-400">Failed to read balances: {error}</p>
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-sm text-gray-400">No stablecoin balances found on Ethereum, Base, Arbitrum, or Optimism.</p>
        <p className="text-xs text-gray-600 mt-2">
          Connect a wallet with USDC or USDT to get a personalized recommendation.
        </p>
        {onDemoMode && (
          <button
            onClick={onDemoMode}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Try demo mode with simulated balances
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Your Stablecoins</h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">idle across {balances.length} position{balances.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {balances.map((b) => (
          <ChainBalanceRow key={`${b.chainId}-${b.token}`} balance={b} />
        ))}
      </div>
    </div>
  )
}
