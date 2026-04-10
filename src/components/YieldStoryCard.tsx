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
      {/* Gradient header */}
      <div className={`px-6 py-5 ${
        isSuccess
          ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/20'
          : 'bg-gradient-to-r from-yellow-900/30 to-amber-900/15'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color: chainMeta?.color }}>
              {chainMeta?.name?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider">YieldPilot</span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-400">{mandateName} mandate</span>
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
              <span className="text-4xl font-bold text-green-400">
                {analysis.newApy.toFixed(2)}%
              </span>
              <span className="text-sm text-gray-500">APY</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Moved</span>
                <span className="text-sm text-white font-medium">
                  ${analysis.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Into</span>
                <span className="text-sm text-white font-medium">{vaultName} via {protocolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Chain</span>
                <span className="text-sm text-white font-medium">{chainMeta?.name || `Chain ${chainId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Route cost recovered</span>
                <span className="text-sm text-green-400 font-medium">
                  {analysis.breakEvenDays?.toFixed(1) || '0'} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Projected annual yield</span>
                <span className="text-sm text-green-400 font-medium">
                  +${analysis.annualYieldUpliftUsd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tagline */}
            <div className="pt-3 border-t border-white/5">
              <p className="text-sm text-gray-300 italic">
                From idle capital to productive yield. Mandate-approved.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Refusal content */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-yellow-400">$0</span>
              <span className="text-sm text-gray-500">moved</span>
            </div>

            <div className="space-y-2">
              {analysis.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-yellow-500 text-sm mt-0.5">!</span>
                  <p className="text-sm text-gray-400">{reason}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-sm text-gray-300 italic">
                Your mandate protected your capital. No unnecessary moves.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-white/[0.02] flex items-center justify-between">
        <span className="text-xs text-gray-600">yieldpilot-iota.vercel.app</span>
        {txHash && (
          <span className="text-xs text-gray-600 font-mono">
            {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </span>
        )}
      </div>
    </div>
  )
}
