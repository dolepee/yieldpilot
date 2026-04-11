'use client'

import type { WorthItAnalysis } from '@/lib/worth-it'
import { CHAIN_META } from '@/lib/constants'

interface YieldStoryCardProps {
  analysis: WorthItAnalysis
  mandateName: string
  vaultName: string
  protocolName: string
  chainId: number
  txHash?: string
}

export function YieldStoryCard({
  analysis,
  mandateName,
  vaultName,
  protocolName,
  chainId,
  txHash,
}: YieldStoryCardProps) {
  const chainMeta = CHAIN_META[chainId]
  const isSuccess = analysis.verdict === 'approved' && txHash

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
          {isSuccess ? 'Mandate honored' : 'Funds stayed put'}
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
        <span className="text-xs text-white/25">yieldpilot-iota.vercel.app</span>
        {txHash && (
          <span className="text-xs text-white/25 font-mono">
            {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </span>
        )}
      </div>
    </div>
  )
}
