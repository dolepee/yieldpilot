'use client'

import { ArrowUpRight, RefreshCcw, ShieldCheck } from 'lucide-react'
import { CHAIN_META } from '@/lib/constants'
import type { VaultPosition } from '@/hooks/useVaultPositions'

interface VaultPositionsPanelProps {
  positions: VaultPosition[]
  totalUsd: number
  isLoading: boolean
  error: string | null
  activeWithdrawAddress?: string
  isWithdrawing?: boolean
  withdrawHash?: string
  onRefresh: () => void
  onWithdraw: (position: VaultPosition) => void
}

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  })
}

export function VaultPositionsPanel({
  positions,
  totalUsd,
  isLoading,
  error,
  activeWithdrawAddress,
  isWithdrawing,
  withdrawHash,
  onRefresh,
  onWithdraw,
}: VaultPositionsPanelProps) {
  return (
    <div className="card overflow-hidden border-emerald-400/15">
      <div className="flex items-center justify-between border-b border-white/10 bg-emerald-400/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Your Earn positions</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white">${formatUsd(totalUsd)}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55 transition-colors hover:border-[#00d4aa]/40 hover:text-[#00d4aa] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw size={13} strokeWidth={1.8} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-3 p-5">
        {isLoading && positions.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-4">
            <p className="text-sm text-white/50">Scanning vault share balances across supported LI.FI vaults...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">
            <p className="text-xs text-rose-100/80">{error}</p>
          </div>
        )}

        {!isLoading && positions.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-4">
            <p className="text-sm text-white/55">No LI.FI Earn vault positions detected yet.</p>
            <p className="mt-2 text-xs leading-5 text-white/35">
              This scans vault share tokens directly, including the legacy Steakhouse USDC vault used by earlier routes.
            </p>
          </div>
        )}

        {positions.map((position) => {
          const chainMeta = CHAIN_META[position.vault.chainId]
          const isActive = activeWithdrawAddress?.toLowerCase() === position.vault.address.toLowerCase()
          const explorerUrl = chainMeta?.explorer
            ? `${chainMeta.explorer}/address/${position.vault.address}`
            : undefined

          return (
            <div key={`${position.vault.chainId}:${position.vault.address}`} className="rounded-xl border border-white/10 bg-[#121212] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{position.vault.name}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
                      {chainMeta?.name ?? position.vault.network}
                    </span>
                    {position.source === 'legacy-vault' && (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100/70">
                        legacy route
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/40">{position.vault.protocol.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-[#00d4aa]">
                    {Number(position.underlyingFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} {position.underlyingSymbol}
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    {position.isEstimated ? 'share-estimated' : 'assets from vault'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <span className="text-white/35">Shares</span>
                  <p className="mt-1 font-mono text-white/70">{Number(position.sharesFormatted).toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <span className="text-white/35">APY source</span>
                  <p className="mt-1 font-mono text-white/70">
                    {position.source === 'legacy-vault' ? 'protocol live' : `${position.vault.analytics.apy.total.toFixed(2)}% indexed`}
                  </p>
                </div>
              </div>

              {isActive && withdrawHash && (
                <div className="mt-3 rounded-lg border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-2 text-xs text-[#baffef]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} strokeWidth={1.8} />
                    <span>Withdrawal submitted.</span>
                    {chainMeta?.explorer && (
                      <a
                        href={`${chainMeta.explorer}/tx/${withdrawHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#00d4aa] hover:opacity-80"
                      >
                        View tx <ArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onWithdraw(position)}
                  disabled={isWithdrawing}
                  className="rounded-md bg-[#00d4aa] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isActive && isWithdrawing ? 'Confirming...' : 'Withdraw position'}
                </button>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-sm text-white/55 hover:border-[#00d4aa]/40 hover:text-[#00d4aa]"
                  >
                    Vault contract <ArrowUpRight size={14} />
                  </a>
                )}
                <a
                  href={position.vault.protocol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-sm text-white/55 hover:border-[#00d4aa]/40 hover:text-[#00d4aa]"
                >
                  Protocol <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
