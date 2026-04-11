'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-white">YieldPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#121212] px-3 py-2 text-xs text-white/60 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00d4aa]" />
            <span>Network online</span>
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
                  : account.displayName

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
