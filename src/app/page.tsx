'use client'

import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { WalletSnapshot } from '@/components/WalletSnapshot'
import { EarnStats } from '@/components/EarnStats'
import { MandatePicker } from '@/components/MandatePicker'
import { RecommendationCard } from '@/components/RecommendationCard'
import { useEarnData } from '@/hooks/useEarnData'
import { useStablecoinBalances, type TokenBalance } from '@/hooks/useStablecoinBalances'
import { MANDATES, type MandateKey } from '@/lib/mandates'
import { recommend, type RecommendationResult } from '@/lib/ranking'

export default function Home() {
  const { address, isConnected } = useAccount()
  const earnData = useEarnData()
  const balanceData = useStablecoinBalances(address)

  const [selectedMandate, setSelectedMandate] = useState<MandateKey | null>(null)

  // Run recommendation when mandate is selected and data is ready
  const recommendation: RecommendationResult | null = useMemo(() => {
    if (!selectedMandate || earnData.isLoading || balanceData.isLoading) return null
    if (earnData.vaults.length === 0) return null

    const mandate = MANDATES[selectedMandate]
    return recommend(earnData.vaults, mandate, balanceData.balances)
  }, [selectedMandate, earnData.vaults, earnData.isLoading, balanceData.balances, balanceData.isLoading])

  const handleExecute = () => {
    // Day 3: Composer quote + worth-it analysis
    console.log('Execute triggered — Composer integration pending Day 3')
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Your stablecoins, your rules
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            YieldPilot only moves your money when the opportunity satisfies your mandate
            and the move is economically worth it.
          </p>
        </div>

        {/* Earn Data Stats */}
        <EarnStats />

        {/* Main Flow */}
        {isConnected && address ? (
          <>
            {/* Screen 1: Wallet Snapshot */}
            <WalletSnapshot address={address} />

            {/* Screen 2: Mandate Picker */}
            {!balanceData.isLoading && (
              <MandatePicker
                selected={selectedMandate}
                onSelect={setSelectedMandate}
              />
            )}

            {/* Screen 3: Recommendation */}
            {recommendation && selectedMandate && (
              <RecommendationCard
                result={recommendation}
                mandateName={MANDATES[selectedMandate].name}
                onExecute={recommendation.type === 'recommended' ? handleExecute : undefined}
              />
            )}

            {/* Loading state for recommendation */}
            {selectedMandate && !recommendation && (earnData.isLoading || balanceData.isLoading) && (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Scanning vaults against your mandate...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="#3B82F6" strokeWidth="1.5"/>
                <path d="M16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14C14 13.4477 14.4477 13 15 13C15.5523 13 16 13.4477 16 14Z" fill="#3B82F6"/>
                <path d="M3 9L7 4H17L21 9" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect your wallet</h2>
            <p className="text-sm text-gray-400 mb-1">
              YieldPilot will scan your USDC and USDT balances across Ethereum, Base, Arbitrum, and Optimism.
            </p>
            <p className="text-xs text-gray-600">
              Read-only scan. No transactions without your approval.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-600">
            Powered by <a href="https://li.fi" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">LI.FI</a> Earn Data API + Composer
          </p>
        </div>
      </main>
    </>
  )
}
