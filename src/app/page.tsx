'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { Header } from '@/components/Header'
import { WalletSnapshot } from '@/components/WalletSnapshot'
import { EarnStats } from '@/components/EarnStats'
import { MandatePicker } from '@/components/MandatePicker'
import { RecommendationCard } from '@/components/RecommendationCard'
import { WorthItCard } from '@/components/WorthItCard'
import { YieldStoryCard } from '@/components/YieldStoryCard'
import { useEarnData } from '@/hooks/useEarnData'
import { useStablecoinBalances } from '@/hooks/useStablecoinBalances'
import { MANDATES, type MandateKey } from '@/lib/mandates'
import { recommend, type RecommendationResult } from '@/lib/ranking'
import { analyzeWorthIt, type WorthItAnalysis } from '@/lib/worth-it'
import type { ComposerQuote } from '@/lib/composer'

type AppStep = 'snapshot' | 'mandate' | 'recommendation' | 'analysis' | 'executing' | 'done'

export default function Home() {
  const { address, isConnected } = useAccount()
  const earnData = useEarnData()
  const balanceData = useStablecoinBalances(address)

  const [selectedMandate, setSelectedMandate] = useState<MandateKey | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [worthItAnalysis, setWorthItAnalysis] = useState<WorthItAnalysis | null>(null)
  const [composerQuote, setComposerQuote] = useState<ComposerQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Run recommendation when mandate is selected and data is ready
  const recommendation: RecommendationResult | null = useMemo(() => {
    if (!selectedMandate || earnData.isLoading || balanceData.isLoading) return null
    if (earnData.vaults.length === 0) return null

    const mandate = MANDATES[selectedMandate]
    return recommend(earnData.vaults, mandate, balanceData.balances)
  }, [selectedMandate, earnData.vaults, earnData.isLoading, balanceData.balances, balanceData.isLoading])

  // Fetch Composer quote and run worth-it analysis
  const handleAnalyze = useCallback(async () => {
    if (!recommendation?.top || !selectedMandate || !address) return

    setIsLoadingQuote(true)
    setQuoteError(null)
    setWorthItAnalysis(null)
    setComposerQuote(null)

    const scored = recommendation.top
    const vault = scored.vault
    const balance = scored.matchedBalance

    // Build amount in smallest unit
    const amount = parseUnits(balance.formatted, balance.decimals).toString()

    const params = new URLSearchParams({
      fromChain: String(balance.chainId),
      toChain: String(vault.chainId),
      fromToken: balance.address,
      toToken: vault.address as string,
      fromAddress: address,
      toAddress: address,
      fromAmount: amount,
    })

    try {
      const res = await fetch(`/api/quote?${params}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setQuoteError(data.error || data.message || `Quote failed: ${res.status}`)
        setIsLoadingQuote(false)
        return
      }

      const quote = data as ComposerQuote
      setComposerQuote(quote)

      // Run worth-it analysis
      const mandate = MANDATES[selectedMandate]
      const analysis = analyzeWorthIt(quote, scored, mandate)
      setWorthItAnalysis(analysis)
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : 'Failed to get quote')
    } finally {
      setIsLoadingQuote(false)
    }
  }, [recommendation, selectedMandate, address])

  // Execute the approved move
  const handleExecute = useCallback(() => {
    if (!composerQuote?.transactionRequest) return

    const tx = composerQuote.transactionRequest
    sendTransaction({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: BigInt(tx.value || '0'),
      chainId: tx.chainId,
    })
  }, [composerQuote, sendTransaction])

  // Determine current step for UI
  const currentStep: AppStep = isConfirmed ? 'done'
    : (isSending || isConfirming) ? 'executing'
    : worthItAnalysis ? 'analysis'
    : recommendation ? 'recommendation'
    : selectedMandate ? 'mandate'
    : 'snapshot'

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
                onSelect={(key) => {
                  setSelectedMandate(key)
                  setWorthItAnalysis(null)
                  setComposerQuote(null)
                  setQuoteError(null)
                }}
              />
            )}

            {/* Screen 3: Recommendation */}
            {recommendation && selectedMandate && !worthItAnalysis && (
              <RecommendationCard
                result={recommendation}
                mandateName={MANDATES[selectedMandate].name}
                onExecute={recommendation.type === 'recommended' ? handleAnalyze : undefined}
                isLoadingQuote={isLoadingQuote}
              />
            )}

            {/* Quote error */}
            {quoteError && (
              <div className="card p-4 border-red-500/20">
                <p className="text-sm text-red-400">Quote error: {quoteError}</p>
                <button
                  onClick={() => { setQuoteError(null); handleAnalyze() }}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Screen 4: Worth-It Analysis */}
            {worthItAnalysis && selectedMandate && currentStep !== 'executing' && currentStep !== 'done' && (
              <WorthItCard
                analysis={worthItAnalysis}
                mandateName={MANDATES[selectedMandate].name}
                onExecute={worthItAnalysis.verdict === 'approved' ? handleExecute : undefined}
                isExecuting={isSending}
              />
            )}

            {/* Screen 5: Execution Tracker */}
            {(isSending || isConfirming) && (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {isSending ? 'Waiting for wallet signature...' : 'Transaction confirming...'}
                    </p>
                    {txHash && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">{txHash}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Screen 6: Yield Story Card */}
            {isConfirmed && txHash && worthItAnalysis && recommendation?.top && selectedMandate && (
              <YieldStoryCard
                analysis={worthItAnalysis}
                mandateName={MANDATES[selectedMandate].name}
                vaultName={recommendation.top.vault.name}
                protocolName={recommendation.top.vault.protocol.name}
                chainId={recommendation.top.vault.chainId}
                txHash={txHash}
              />
            )}

            {/* Refusal Story Card — show when mandate analysis refuses */}
            {worthItAnalysis && worthItAnalysis.verdict === 'refused' && selectedMandate && recommendation?.top && (
              <YieldStoryCard
                analysis={worthItAnalysis}
                mandateName={MANDATES[selectedMandate].name}
                vaultName={recommendation.top.vault.name}
                protocolName={recommendation.top.vault.protocol.name}
                chainId={recommendation.top.vault.chainId}
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
