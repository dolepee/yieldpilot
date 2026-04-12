'use client'

import { useMemo, useState } from 'react'
import type { WorthItAnalysis } from '@/lib/worth-it'
import { CHAIN_META } from '@/lib/constants'
import type { PortfolioVerification } from '@/hooks/usePortfolioVerification'

interface YieldStoryCardProps {
  analysis: WorthItAnalysis
  mandateName: string
  vaultName: string
  protocolName: string
  chainId: number
  txHash?: string
  vaultAddress?: string
  vaultNetwork?: string
  protocolUrl?: string
  isRedeemable?: boolean
  portfolioVerification?: PortfolioVerification
}

export function YieldStoryCard({
  analysis,
  mandateName,
  vaultName,
  protocolName,
  chainId,
  txHash,
  vaultAddress,
  vaultNetwork,
  protocolUrl,
  isRedeemable,
  portfolioVerification,
}: YieldStoryCardProps) {
  const [copied, setCopied] = useState(false)
  const chainMeta = CHAIN_META[chainId]
  const isSuccess = analysis.verdict === 'approved' && txHash
  const explorerTxUrl = txHash && chainMeta?.explorer ? `${chainMeta.explorer}/tx/${txHash}` : null
  const explorerVaultUrl = vaultAddress && chainMeta?.explorer ? `${chainMeta.explorer}/address/${vaultAddress}` : null
  const receiptText = useMemo(() => {
    const status = isSuccess ? 'Mandate honored' : 'Funds stayed put'
    const routeLine = isSuccess
      ? `Moved $${analysis.amountUsd.toFixed(2)} into ${vaultName} on ${chainMeta?.name ?? `Chain ${chainId}`}.`
      : `Moved $0. ${analysis.reasons[0] ?? 'Route failed mandate economics.'}`
    return [
      `YieldPilot receipt: ${status}`,
      `Mandate: ${mandateName}`,
      routeLine,
      `APY: ${analysis.newApy.toFixed(2)}%`,
      `Route cost: $${analysis.routeCostUsd.toFixed(2)}`,
      `Break-even: ${analysis.breakEvenDays !== null ? `${analysis.breakEvenDays.toFixed(1)} days` : 'n/a'}`,
      txHash ? `Tx: ${txHash}` : null,
    ].filter(Boolean).join('\n')
  }, [analysis, chainId, chainMeta?.name, isSuccess, mandateName, txHash, vaultName])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className={`border-b px-6 py-5 ${
        isSuccess
          ? 'border-[#00d4aa]/20 bg-[#00d4aa]/5'
          : 'border-white/10 bg-[#1a1a1a]'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full border border-white/10 bg-[#0a0a0a] flex items-center justify-center">
            <span className="text-xs font-bold text-[#00d4aa]">
              {chainMeta?.name?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-xs text-white/45 uppercase tracking-wider">YieldPilot</span>
          <span className="text-xs text-white/20">|</span>
          <span className="text-xs text-white/45">{mandateName} mandate</span>
        </div>
        <h3 className="text-xl font-bold text-white">
          {isSuccess ? 'Mandate honored' : 'Mandate receipt: funds stayed put'}
        </h3>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {isSuccess ? (
          <>
            {/* Success content */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold text-[#00d4aa]">
                {analysis.newApy.toFixed(2)}%
              </span>
              <span className="text-sm text-white/40">APY</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Moved</span>
                <span className="font-mono text-sm text-white font-medium">
                  ${analysis.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Into</span>
                <span className="text-sm text-white font-medium">{vaultName} via {protocolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Chain</span>
                <span className="text-sm text-white font-medium">{chainMeta?.name || `Chain ${chainId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Route cost recovered</span>
                <span className="font-mono text-sm text-[#00d4aa] font-medium">
                  {analysis.breakEvenDays?.toFixed(1) || '0'} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Projected annual yield</span>
                <span className="font-mono text-sm text-[#00d4aa] font-medium">
                  +${analysis.annualYieldUpliftUsd.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#00d4aa]/15 bg-[#00d4aa]/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#baffef]">Post-deposit verification</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/45">LI.FI status</span>
                  <span className="font-mono text-[#00d4aa]">DONE</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/45">Vault position</span>
                  <span className={`text-right ${portfolioVerification?.matched ? 'text-[#00d4aa]' : 'text-white/75'}`}>
                    {portfolioVerification?.isLoading
                      ? 'Scanning LI.FI portfolio...'
                      : portfolioVerification?.matched
                        ? 'Detected in LI.FI portfolio'
                        : portfolioVerification?.checked
                          ? `Route confirmed; check ${protocolName} after indexing`
                          : `Check ${protocolName} after indexing`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/45">Withdrawal path</span>
                  <span className={isRedeemable ? 'text-[#00d4aa]' : 'text-white/50'}>
                    {isRedeemable ? 'Redeemable when liquidity is available' : 'Verify protocol redeem support'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {explorerTxUrl && (
                  <a
                    href={explorerTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 hover:border-[#00d4aa]/30 hover:text-[#00d4aa]"
                  >
                    View tx
                  </a>
                )}
                {explorerVaultUrl && (
                  <a
                    href={explorerVaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 hover:border-[#00d4aa]/30 hover:text-[#00d4aa]"
                  >
                    View vault contract
                  </a>
                )}
                {protocolUrl && (
                  <a
                    href={protocolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 hover:border-[#00d4aa]/30 hover:text-[#00d4aa]"
                  >
                    Open protocol
                  </a>
                )}
              </div>
            </div>

            {/* Tagline */}
            <div className="pt-3 border-t border-white/5">
              <p className="text-sm text-white/65">
                From idle capital to productive yield. Mandate-approved.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Refusal content */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-white">$0</span>
              <span className="text-sm text-white/40">moved</span>
            </div>

            <div className="space-y-2">
              {analysis.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-white/55 text-sm mt-0.5">!</span>
                  <p className="text-sm text-white/55">{reason}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-sm text-white/65">
                Your mandate protected your capital. No unnecessary moves.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-[#0a0a0a] flex items-center justify-between">
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-white/35 transition-colors hover:text-[#00d4aa]"
        >
          {copied ? 'Receipt copied' : 'Copy mandate receipt'}
        </button>
        {txHash && (
          <span className="text-xs text-white/25 font-mono">
            {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </span>
        )}
        {!txHash && <span className="text-xs text-white/25">{vaultNetwork ?? 'yieldpilot-iota.vercel.app'}</span>}
      </div>
    </div>
  )
}
