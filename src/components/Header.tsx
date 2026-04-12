'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Activity, ShieldCheck, Wallet } from 'lucide-react'
import { useAccount, useEnsName } from 'wagmi'

export function Header() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) },
  })

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/78 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="brand-orb alive-shimmer h-9 w-9 rounded-xl border border-[#00d4aa]/25" />
          <div>
            <span className="text-lg font-semibold tracking-tight text-white">YieldPilot</span>
            <p className="hidden text-[11px] uppercase tracking-[0.22em] text-white/35 sm:block">Mandate Execution Layer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-100/75 lg:flex">
            <ShieldCheck size={14} strokeWidth={1.7} className="text-violet-300" />
            <span>Deterministic risk engine</span>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100/75 sm:flex">
            <Activity size={14} strokeWidth={1.7} className="text-cyan-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            <span>LI.FI online</span>
          </div>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted
              const connected = ready && account && chain
              const label = !connected
                ? 'Connect Wallet'
                : chain.unsupported
                  ? 'Wrong Network'
                  : ensName || account.displayName

              return (
                <button
                  type="button"
                  disabled={!ready}
                  onClick={!connected ? openConnectModal : chain?.unsupported ? openChainModal : openAccountModal}
                  className="inline-flex items-center gap-2 rounded-md bg-[#00d4aa] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Wallet size={16} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
