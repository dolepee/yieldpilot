'use client'

import type { TokenBalance } from '@/hooks/useStablecoinBalances'
import { CHAIN_META } from '@/lib/constants'
import { CircleDollarSign } from 'lucide-react'

function ChainBalanceRow({ balance }: { balance: TokenBalance }) {
  const meta = CHAIN_META[balance.chainId]
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-white/10 py-4 first:border-t-0 md:grid-cols-[1.4fr_1fr_auto]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-[#00d4aa]">
          <CircleDollarSign size={17} strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{balance.token}</p>
          <p className="text-xs text-white/40">Stablecoin</p>
        </div>
      </div>
      <div className="hidden text-sm text-white/60 md:block">{meta?.name || `Chain ${balance.chainId}`}</div>
      <div className="text-right font-mono tabular-nums">
        <p className="text-sm font-semibold text-white">{Number(balance.formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-white/40">{balance.token}</p>
      </div>
    </div>
  )
}

interface WalletSnapshotProps {
  balances: TokenBalance[]
  totalUsd: number
  isLoading: boolean
  error: string | null
  isDemoMode?: boolean
  onDemoMode?: () => void
}

export function WalletSnapshot({
  balances,
  totalUsd,
  isLoading,
  error,
  isDemoMode,
  onDemoMode,
}: WalletSnapshotProps) {
  if (isLoading) {
    return (
      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#00d4aa]" />
          <p className="text-sm text-white/60">Scanning stablecoin balances across supported chains...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 md:p-8">
        <p className="text-sm text-white">Failed to read balances.</p>
        <p className="mt-2 font-mono text-xs text-white/50">{error}</p>
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="card p-6 md:p-8">
        <p className="text-sm text-white/70">No stablecoin balances found on Ethereum, Base, Arbitrum, or Optimism.</p>
        <p className="mt-2 text-xs text-white/40">
          Connect a wallet with USDC or USDT to get a personalized recommendation.
        </p>
        {onDemoMode && (
          <button
            onClick={onDemoMode}
            className="mt-5 rounded-md border border-[#00d4aa]/40 px-4 py-2 text-sm font-medium text-[#00d4aa] transition-colors hover:border-[#00d4aa]"
          >
            Try demo mode with simulated balances
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Wallet Scan Panel</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Scanned Stablecoins</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold tabular-nums text-white">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-white/40">
            {isDemoMode ? 'demo balances' : 'idle'} across {balances.length} position{balances.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mb-2 hidden grid-cols-[1.4fr_1fr_auto] gap-4 px-1 text-[11px] uppercase tracking-[0.18em] text-white/35 md:grid">
        <span>Token</span>
        <span>Chain</span>
        <span className="text-right">Balance</span>
      </div>
      <div>
        {balances.map((b) => (
          <ChainBalanceRow key={`${b.chainId}-${b.token}`} balance={b} />
        ))}
      </div>
    </div>
  )
}
