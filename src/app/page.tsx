'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAccount, useChainId, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseUnits, createPublicClient, http } from 'viem'
import { Header } from '@/components/Header'
import { WalletSnapshot } from '@/components/WalletSnapshot'
import { EarnStats } from '@/components/EarnStats'
import { IntentPlanner } from '@/components/IntentPlanner'
import { DecisionTrace } from '@/components/DecisionTrace'
import { MandatePicker } from '@/components/MandatePicker'
import { RecommendationCard } from '@/components/RecommendationCard'
import { WorthItCard } from '@/components/WorthItCard'
import { YieldStoryCard } from '@/components/YieldStoryCard'
import { ExecutionTracker } from '@/components/ExecutionTracker'
import { useEarnData } from '@/hooks/useEarnData'
import { useStablecoinBalances, type TokenBalance } from '@/hooks/useStablecoinBalances'
import { MANDATES, type MandateConfig, type MandateKey } from '@/lib/mandates'
import { recommend, type RecommendationResult } from '@/lib/ranking'
import { analyzeWorthIt, type WorthItAnalysis } from '@/lib/worth-it'
import { DEMO_BALANCES } from '@/lib/demo'
import type { ComposerQuote } from '@/lib/composer'
import { useLifiStatus } from '@/hooks/useLifiStatus'
import { ERC20_ALLOWANCE_ABI, TARGET_CHAINS } from '@/lib/constants'
import type { IntentPlan } from '@/lib/intent'

export default function Home() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const earnData = useEarnData()
  const balanceData = useStablecoinBalances(address)

  const [selectedMandate, setSelectedMandate] = useState<MandateKey | null>(null)
  const [strategyPrompt, setStrategyPrompt] = useState('')
  const [intentPlan, setIntentPlan] = useState<IntentPlan | null>(null)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [isParsingIntent, setIsParsingIntent] = useState(false)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [worthItAnalysis, setWorthItAnalysis] = useState<WorthItAnalysis | null>(null)
  const [composerQuote, setComposerQuote] = useState<ComposerQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)
  const [approvalRequired, setApprovalRequired] = useState(false)
  const [pendingRouteAfterApproval, setPendingRouteAfterApproval] = useState(false)
  const [activeRouteHash, setActiveRouteHash] = useState<`0x${string}` | undefined>()
  const [activeRouteFromChainId, setActiveRouteFromChainId] = useState<number | undefined>()
  const [activeApprovalHash, setActiveApprovalHash] = useState<`0x${string}` | undefined>()

  const { sendTransactionAsync, isPending: isSending } = useSendTransaction()
  const { writeContractAsync, isPending: isApproving } = useWriteContract()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: activeRouteHash })
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: activeApprovalHash })

  // Use demo balances if in demo mode, otherwise real balances
  const activeBalances: TokenBalance[] = isDemoMode ? DEMO_BALANCES : balanceData.balances
  const isBalanceReady = isDemoMode || !balanceData.isLoading
  const activeTotalUsd = useMemo(
    () => activeBalances.reduce((sum, balance) => sum + balance.usdValue, 0),
    [activeBalances]
  )

  const activeMandate: MandateConfig | null = useMemo(() => {
    if (intentPlan) return intentPlan.mandate
    if (selectedMandate) return MANDATES[selectedMandate]
    return null
  }, [intentPlan, selectedMandate])

  const activeMandateName = activeMandate?.name ?? null

  // Run recommendation when mandate is selected and data is ready
  const recommendation: RecommendationResult | null = useMemo(() => {
    if (!activeMandate || earnData.isLoading || !isBalanceReady) return null
    if (earnData.vaults.length === 0) return null

    return recommend(earnData.vaults, activeMandate, activeBalances)
  }, [activeMandate, earnData.vaults, earnData.isLoading, activeBalances, isBalanceReady])

  const { status: lifiStatus } = useLifiStatus(activeRouteHash, activeRouteFromChainId)

  const executeRouteTransaction = useCallback(async () => {
    if (!composerQuote?.transactionRequest) return

    const tx = composerQuote.transactionRequest

    try {
      setExecutionError(null)
      if (currentChainId !== tx.chainId) {
        await switchChainAsync({ chainId: tx.chainId })
      }
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || '0'),
        chainId: tx.chainId,
      })
      setActiveRouteHash(hash)
      setActiveRouteFromChainId(tx.chainId)
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : 'Failed to submit route transaction')
    }
  }, [composerQuote, currentChainId, sendTransactionAsync, switchChainAsync])

  useEffect(() => {
    if (!pendingRouteAfterApproval || !isApprovalConfirmed) return
    setPendingRouteAfterApproval(false)
    void executeRouteTransaction()
  }, [pendingRouteAfterApproval, isApprovalConfirmed, executeRouteTransaction])

  // Fetch Composer quote and run worth-it analysis
  const handleAnalyze = useCallback(async () => {
    if (!recommendation?.top || !activeMandate || !address) return

    setIsLoadingQuote(true)
    setQuoteError(null)
    setWorthItAnalysis(null)
    setComposerQuote(null)
    setExecutionError(null)
    setApprovalRequired(false)
    setPendingRouteAfterApproval(false)
    setActiveRouteHash(undefined)
    setActiveRouteFromChainId(undefined)
    setActiveApprovalHash(undefined)

    const scored = recommendation.top
    const vault = scored.vault
    const balance = scored.matchedBalance

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

      const analysis = analyzeWorthIt(quote, scored, activeMandate)
      setWorthItAnalysis(analysis)
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : 'Failed to get quote')
    } finally {
      setIsLoadingQuote(false)
    }
  }, [recommendation, activeMandate, address])

  const handleGenerateIntent = useCallback(async () => {
    if (!strategyPrompt.trim()) return

    setIsParsingIntent(true)
    setSelectedMandate(null)
    setIntentPlan(null)
    setIntentError(null)
    setWorthItAnalysis(null)
    setComposerQuote(null)
    setQuoteError(null)
    setExecutionError(null)
    setApprovalRequired(false)
    setPendingRouteAfterApproval(false)
    setActiveRouteHash(undefined)
    setActiveRouteFromChainId(undefined)
    setActiveApprovalHash(undefined)

    try {
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: strategyPrompt.trim(),
          balances: activeBalances.map(balance => ({
            chainId: balance.chainId,
            chainName: balance.chainName,
            token: balance.token,
            formatted: balance.formatted,
            usdValue: balance.usdValue,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setIntentError(data.error || 'Failed to parse strategy')
        return
      }

      setIntentPlan(data)
      setSelectedMandate(null)
    } catch (error) {
      setIntentError(error instanceof Error ? error.message : 'Failed to parse strategy')
    } finally {
      setIsParsingIntent(false)
    }
  }, [strategyPrompt, activeBalances])

  // Execute the approved move
  const handleExecute = useCallback(async () => {
    if (!composerQuote?.transactionRequest || !address) return

    const approvalAddress = composerQuote.estimate.approvalAddress as `0x${string}` | undefined
    const fromToken = composerQuote.action.fromToken.address as `0x${string}`
    const fromAmount = BigInt(composerQuote.action.fromAmount)
    const fromChainId = composerQuote.action.fromChainId
    const chain = TARGET_CHAINS.find((candidate) => candidate.id === fromChainId)

    setExecutionError(null)
    setActiveApprovalHash(undefined)
    setActiveRouteHash(undefined)
    setActiveRouteFromChainId(undefined)
    setPendingRouteAfterApproval(false)

    if (!approvalAddress || !chain) {
      setApprovalRequired(false)
      await executeRouteTransaction()
      return
    }

    setIsCheckingAllowance(true)

    try {
      const publicClient = createPublicClient({ chain, transport: http() })
      const allowance = await publicClient.readContract({
        address: fromToken,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'allowance',
        args: [address, approvalAddress],
      })

      if (allowance >= fromAmount) {
        setApprovalRequired(false)
        await executeRouteTransaction()
        return
      }

      setApprovalRequired(true)
      setPendingRouteAfterApproval(true)

      if (currentChainId !== fromChainId) {
        await switchChainAsync({ chainId: fromChainId })
      }

      const approvalHash = await writeContractAsync({
        address: fromToken,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'approve',
        args: [approvalAddress, fromAmount],
        chainId: fromChainId,
      })
      setActiveApprovalHash(approvalHash)
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : 'Failed to prepare approval')
      setPendingRouteAfterApproval(false)
    } finally {
      setIsCheckingAllowance(false)
    }
  }, [address, composerQuote, currentChainId, executeRouteTransaction, switchChainAsync, writeContractAsync])

  const handleMandateSelect = (key: MandateKey) => {
    setSelectedMandate(key)
    setStrategyPrompt('')
    setIntentPlan(null)
    setIntentError(null)
    setWorthItAnalysis(null)
    setComposerQuote(null)
    setQuoteError(null)
    setExecutionError(null)
    setApprovalRequired(false)
    setPendingRouteAfterApproval(false)
    setActiveRouteHash(undefined)
    setActiveRouteFromChainId(undefined)
    setActiveApprovalHash(undefined)
  }

  const handleUsePresetInstead = useCallback(() => {
    setIntentPlan(null)
    setIntentError(null)
    setStrategyPrompt('')
    setWorthItAnalysis(null)
    setComposerQuote(null)
    setQuoteError(null)
    setExecutionError(null)
    setApprovalRequired(false)
    setPendingRouteAfterApproval(false)
    setActiveRouteHash(undefined)
    setActiveRouteFromChainId(undefined)
    setActiveApprovalHash(undefined)
  }, [])

  const showExecutionTracker = !!activeRouteHash && worthItAnalysis?.verdict === 'approved' && !(
    lifiStatus === 'DONE' && activeRouteHash && worthItAnalysis && recommendation?.top && activeMandate
  )
  const isBusy = isCheckingAllowance || isSwitchingChain || isApproving || isApprovalConfirming || isSending || isConfirming
  const executeButtonLabel = isCheckingAllowance
    ? 'Checking allowance...'
    : isSwitchingChain
      ? 'Switching chain...'
      : isApproving
      ? 'Confirm approval...'
      : isApprovalConfirming
        ? 'Waiting for approval...'
        : isSending
          ? 'Confirm route...'
          : 'Executing...'
  const showStoryCard = lifiStatus === 'DONE' && activeRouteHash && worthItAnalysis && recommendation?.top && activeMandate

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Tell YieldPilot your rules
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Translate natural language into a real yield mandate, score vaults deterministically,
            and only execute when the route is economically worth it.
          </p>
        </div>

        {/* Earn Data Stats */}
        <EarnStats
          vaults={earnData.vaults}
          chains={earnData.chains}
          protocols={earnData.protocols}
          isLoading={earnData.isLoading}
          error={earnData.error}
        />

        {/* Main Flow */}
        {isConnected && address ? (
          <>
            {/* Demo mode banner */}
            {isDemoMode && (
              <div className="card p-3 border-yellow-500/20 flex items-center justify-between">
                <p className="text-xs text-yellow-400">
                  Demo mode: using simulated balances. Execution is disabled.
                </p>
                <button
                  onClick={() => { setIsDemoMode(false); setSelectedMandate(null); setIntentPlan(null); setStrategyPrompt('') }}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Exit demo
                </button>
              </div>
            )}

            {/* Screen 1: Wallet Snapshot */}
            <WalletSnapshot
              balances={activeBalances}
              totalUsd={activeTotalUsd}
              isLoading={!isDemoMode && balanceData.isLoading}
              error={isDemoMode ? null : balanceData.error}
              isDemoMode={isDemoMode}
              onDemoMode={() => setIsDemoMode(true)}
            />

            {/* Screen 2: AI Intent Planner */}
            {isBalanceReady && (activeBalances.length > 0 || isDemoMode) && (
              <IntentPlanner
                prompt={strategyPrompt}
                onPromptChange={setStrategyPrompt}
                onAnalyze={handleGenerateIntent}
                onUsePreset={handleUsePresetInstead}
                isLoading={isParsingIntent}
                error={intentError}
                plan={intentPlan}
                disabled={isLoadingQuote || isBusy}
              />
            )}

            {/* Screen 3: Mandate Picker */}
            {isBalanceReady && (activeBalances.length > 0 || isDemoMode) && (
              <MandatePicker
                selected={selectedMandate}
                onSelect={handleMandateSelect}
              />
            )}

            {/* AI decision audit trail */}
            {activeMandate && (
              <DecisionTrace
                prompt={intentPlan?.prompt}
                source={intentPlan?.source ?? (selectedMandate ? 'preset' : undefined)}
                mandate={activeMandate}
                scannedVaults={earnData.vaults.length}
                recommendation={recommendation}
                worthItAnalysis={worthItAnalysis}
                preferredChains={intentPlan?.preferredChains}
              />
            )}

            {/* Screen 4: Recommendation */}
            {recommendation && activeMandate && !worthItAnalysis && !showExecutionTracker && !showStoryCard && (
              <RecommendationCard
                result={recommendation}
                mandateName={activeMandateName ?? 'Custom mandate'}
                onExecute={recommendation.type === 'recommended' && !isDemoMode ? handleAnalyze : undefined}
                isLoadingQuote={isLoadingQuote}
              />
            )}

            {/* Demo mode note on recommendation */}
            {recommendation && recommendation.type === 'recommended' && isDemoMode && !worthItAnalysis && (
              <div className="card p-4 border-blue-500/10">
                <p className="text-xs text-gray-500">
                  In demo mode, execution is disabled. Connect a wallet with real stablecoins to execute moves.
                </p>
              </div>
            )}

            {/* Quote error */}
            {(quoteError || executionError) && (
              <div className="card p-4 border-red-500/20">
                <p className="text-sm text-red-400">
                  {quoteError ? `Quote error: ${quoteError}` : `Execution error: ${executionError}`}
                </p>
                {quoteError && (
                  <button
                    onClick={() => { setQuoteError(null); handleAnalyze() }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Screen 4: Worth-It Analysis */}
            {worthItAnalysis && activeMandate && !showExecutionTracker && !showStoryCard && (
              <WorthItCard
                analysis={worthItAnalysis}
                mandateName={activeMandateName ?? 'Custom mandate'}
                onExecute={worthItAnalysis.verdict === 'approved' ? handleExecute : undefined}
                isExecuting={isBusy}
                actionLabel={executeButtonLabel}
              />
            )}

            {/* Worth-it refusal story card */}
            {worthItAnalysis && worthItAnalysis.verdict === 'refused' && activeMandate && recommendation?.top && (
              <YieldStoryCard
                analysis={worthItAnalysis}
                mandateName={activeMandateName ?? 'Custom mandate'}
                vaultName={recommendation.top.vault.name}
                protocolName={recommendation.top.vault.protocol.name}
                chainId={recommendation.top.vault.chainId}
              />
            )}

            {/* Screen 5: Execution Tracker */}
            {showExecutionTracker && recommendation?.top && (
              <ExecutionTracker
                txHash={activeRouteHash}
                approvalHash={activeApprovalHash}
                approvalRequired={approvalRequired}
                isCheckingAllowance={isCheckingAllowance}
                isApproving={isApproving}
                isApprovalConfirming={isApprovalConfirming}
                isSendingRoute={isSending}
                isRouteConfirming={isConfirming}
                lifiStatus={lifiStatus}
              />
            )}

            {/* Screen 6: Success Yield Story Card */}
            {showStoryCard && (
              <YieldStoryCard
                analysis={worthItAnalysis!}
                mandateName={activeMandateName ?? 'Custom mandate'}
                vaultName={recommendation!.top!.vault.name}
                protocolName={recommendation!.top!.vault.protocol.name}
                chainId={recommendation!.top!.vault.chainId}
                txHash={activeRouteHash}
              />
            )}

            {/* Loading state for recommendation */}
            {activeMandate && !recommendation && (earnData.isLoading || !isBalanceReady) && (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Scanning vaults against your strategy...</p>
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
