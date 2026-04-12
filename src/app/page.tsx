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
import { ScenarioSimulator } from '@/components/ScenarioSimulator'
import { VaultPositionsPanel } from '@/components/VaultPositionsPanel'
import { useEarnData } from '@/hooks/useEarnData'
import { useStablecoinBalances, type TokenBalance } from '@/hooks/useStablecoinBalances'
import { usePortfolioVerification } from '@/hooks/usePortfolioVerification'
import { useVaultPositions, type VaultPosition } from '@/hooks/useVaultPositions'
import { MANDATES, type MandateConfig, type MandateKey } from '@/lib/mandates'
import { recommend, type RecommendationResult, type ScoredVault } from '@/lib/ranking'
import { analyzeWorthIt, type WorthItAnalysis } from '@/lib/worth-it'
import { DEMO_BALANCES } from '@/lib/demo'
import type { ComposerQuote } from '@/lib/composer'
import { useLifiStatus } from '@/hooks/useLifiStatus'
import { ERC20_ALLOWANCE_ABI, ERC4626_VAULT_ABI, TARGET_CHAINS } from '@/lib/constants'
import type { IntentPlan } from '@/lib/intent'
import { BrainCircuit, Database, Route, ShieldCheck, Sparkles } from 'lucide-react'

function candidateKey(candidate: ScoredVault): string {
  return `${candidate.vault.slug}-${candidate.matchedBalance.chainId}-${candidate.matchedBalance.token}`
}

function HeroSection() {
  return (
    <section className="premium-surface rounded-[2rem] px-5 py-8 sm:px-8 lg:px-10 lg:py-11">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-3 py-1.5 text-xs font-medium text-[#baffef]">
            <Sparkles size={14} strokeWidth={1.8} />
            <span>AI mandate compiler for LI.FI Earn</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">
            Define your yield mandate.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            Translate plain-English stablecoin rules into deterministic vault filters, route economics, and execution constraints before capital moves.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Intent', value: 'Bankr LLM', Icon: BrainCircuit, color: 'text-violet-200 border-violet-400/20 bg-violet-400/10' },
              { label: 'Routing', value: 'Composer', Icon: Route, color: 'text-cyan-200 border-cyan-400/20 bg-cyan-400/10' },
              { label: 'Policy', value: 'No blind moves', Icon: ShieldCheck, color: 'text-emerald-200 border-emerald-400/20 bg-emerald-400/10' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className={`rounded-2xl border px-4 py-4 ${color}`}>
                <Icon size={18} strokeWidth={1.7} />
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] opacity-60">{label}</p>
                <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/40">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#00d4aa]" />
            </div>
            <span className="font-mono text-xs text-white/35">yieldpilot.exec</span>
          </div>
          <div className="space-y-3 font-mono text-sm">
            {[
              ['market.index', '623 vaults', 'text-cyan-200'],
              ['risk.policy', 'deterministic', 'text-violet-200'],
              ['route.quote', 'Composer ready', 'text-emerald-200'],
              ['capital.guard', 'break-even enforced', 'text-amber-200'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <span className="text-white/40">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <Database size={17} strokeWidth={1.7} className="text-[#00d4aa]" />
              <p className="text-sm text-[#baffef]">Only execute when constraints and route economics pass.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const earnData = useEarnData()
  const balanceData = useStablecoinBalances(address)
  const vaultPositions = useVaultPositions(address, earnData.vaults)

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
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [activeWithdrawHash, setActiveWithdrawHash] = useState<`0x${string}` | undefined>()
  const [activeWithdrawPosition, setActiveWithdrawPosition] = useState<VaultPosition | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  const { sendTransactionAsync, isPending: isSending } = useSendTransaction()
  const { writeContractAsync, isPending: isApproving } = useWriteContract()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: activeRouteHash })
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: activeApprovalHash })
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({ hash: activeWithdrawHash })

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

  const selectedScoredVault = useMemo(() => {
    if (!recommendation?.candidates.length) return null
    return recommendation.candidates.find((candidate) => candidateKey(candidate) === selectedCandidateKey)
      ?? recommendation.top
  }, [recommendation, selectedCandidateKey])

  useEffect(() => {
    if (!recommendation?.top) {
      setSelectedCandidateKey(null)
      setDepositAmount('')
      return
    }

    const nextKey = candidateKey(recommendation.top)
    setSelectedCandidateKey((current) => {
      if (current && recommendation.candidates.some((candidate) => candidateKey(candidate) === current)) return current
      return nextKey
    })
  }, [recommendation])

  useEffect(() => {
    if (!selectedScoredVault) return
    setDepositAmount(selectedScoredVault.matchedBalance.formatted)
  }, [selectedCandidateKey, selectedScoredVault])

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

  useEffect(() => {
    if (!isWithdrawConfirmed) return
    balanceData.refetch()
    vaultPositions.refetch()
  }, [activeWithdrawHash, isWithdrawConfirmed])

  // Fetch Composer quote and run worth-it analysis
  const handleAnalyze = useCallback(async () => {
    if (!selectedScoredVault || !activeMandate || !address) return

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

    const scored = selectedScoredVault
    const vault = scored.vault
    const balance = scored.matchedBalance
    const normalizedAmount = depositAmount.trim()
    const amountUsd = Number(normalizedAmount)

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setQuoteError('Enter an amount greater than 0.')
      setIsLoadingQuote(false)
      return
    }

    if (amountUsd > balance.usdValue) {
      setQuoteError(`Amount exceeds your ${balance.token} balance on ${balance.chainName}.`)
      setIsLoadingQuote(false)
      return
    }

    try {
      const amount = parseUnits(normalizedAmount, balance.decimals).toString()
      const quoteScored: ScoredVault = {
        ...scored,
        matchedBalance: {
          ...balance,
          balance: BigInt(amount),
          formatted: normalizedAmount,
          usdValue: amountUsd,
        },
      }

      const params = new URLSearchParams({
        fromChain: String(balance.chainId),
        toChain: String(vault.chainId),
        fromToken: balance.address,
        toToken: vault.address as string,
        fromAddress: address,
        toAddress: address,
        fromAmount: amount,
      })

      const res = await fetch(`/api/quote?${params}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setQuoteError(data.error || data.message || `Quote failed: ${res.status}`)
        setIsLoadingQuote(false)
        return
      }

      const quote = data as ComposerQuote
      setComposerQuote(quote)

      const analysis = analyzeWorthIt(quote, quoteScored, activeMandate, 0, amountUsd)
      setWorthItAnalysis(analysis)
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : 'Failed to get quote')
    } finally {
      setIsLoadingQuote(false)
    }
  }, [selectedScoredVault, activeMandate, address, depositAmount])

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
    setSelectedCandidateKey(null)
    setDepositAmount('')

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

  const handleWithdrawPosition = useCallback(async (position: VaultPosition) => {
    if (!address) return

    setWithdrawError(null)
    setActiveWithdrawHash(undefined)
    setActiveWithdrawPosition(position)

    try {
      if (currentChainId !== position.vault.chainId) {
        await switchChainAsync({ chainId: position.vault.chainId })
      }

      const hash = await writeContractAsync({
        address: position.vault.address as `0x${string}`,
        abi: ERC4626_VAULT_ABI,
        functionName: 'redeem',
        args: [position.shares, address, address],
        chainId: position.vault.chainId,
      })

      setActiveWithdrawHash(hash)
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Failed to withdraw position')
    }
  }, [address, currentChainId, switchChainAsync, writeContractAsync])

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
    setSelectedCandidateKey(null)
    setDepositAmount('')
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
    setSelectedCandidateKey(null)
    setDepositAmount('')
  }, [])

  const handleCandidateSelect = useCallback((candidate: ScoredVault) => {
    setSelectedCandidateKey(candidateKey(candidate))
    setDepositAmount(candidate.matchedBalance.formatted)
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

  const handleDepositAmountChange = useCallback((value: string) => {
    setDepositAmount(value)
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
    lifiStatus === 'DONE' && activeRouteHash && worthItAnalysis && selectedScoredVault && activeMandate
  )
  const isWithdrawalBusy = Boolean(activeWithdrawPosition) && (isSwitchingChain || isApproving || isWithdrawConfirming)
  const isBusy = isCheckingAllowance || isSwitchingChain || isApproving || isApprovalConfirming || isSending || isConfirming || isWithdrawConfirming
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
  const showStoryCard = lifiStatus === 'DONE' && activeRouteHash && worthItAnalysis && selectedScoredVault && activeMandate
  const portfolioVerification = usePortfolioVerification(address, selectedScoredVault?.vault, Boolean(showStoryCard))

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-12 px-4 py-10 sm:px-6 lg:py-14">
        <HeroSection />

        {/* Earn Data Stats */}
        <EarnStats
          vaults={earnData.vaults}
          chains={earnData.chains}
          isLoading={earnData.isLoading}
          error={earnData.error}
        />

        {/* Main Flow */}
        {isConnected && address ? (
          <>
            {/* Demo mode banner */}
            {isDemoMode && (
              <div className="card flex items-center justify-between border-white/10 p-4">
                <p className="text-xs text-white/50">
                  Demo mode: using simulated balances. Execution is disabled.
                </p>
                <button
                  onClick={() => { setIsDemoMode(false); setSelectedMandate(null); setIntentPlan(null); setStrategyPrompt('') }}
                  className="text-xs text-[#00d4aa] hover:opacity-80"
                >
                  Exit demo
                </button>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
              <aside className="space-y-6 xl:sticky xl:top-28">
                {/* Screen 1: Wallet Snapshot */}
                <WalletSnapshot
                  balances={activeBalances}
                  totalUsd={activeTotalUsd}
                  isLoading={!isDemoMode && balanceData.isLoading}
                  error={isDemoMode ? null : balanceData.error}
                  isDemoMode={isDemoMode}
                  onDemoMode={() => setIsDemoMode(true)}
                />

                <VaultPositionsPanel
                  positions={vaultPositions.positions}
                  totalUsd={vaultPositions.totalUsd}
                  isLoading={vaultPositions.isLoading}
                  error={vaultPositions.error || withdrawError}
                  activeWithdrawAddress={activeWithdrawPosition?.vault.address}
                  isWithdrawing={isWithdrawalBusy}
                  withdrawHash={activeWithdrawHash}
                  onRefresh={() => {
                    vaultPositions.refetch()
                    balanceData.refetch()
                  }}
                  onWithdraw={handleWithdrawPosition}
                />

                <div className="card overflow-hidden border-cyan-400/15">
                  <div className="border-b border-white/10 bg-cyan-400/10 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Execution Guard</p>
                  </div>
                  <div className="space-y-3 p-5">
                    {[
                      ['Wallet scan', isBalanceReady ? 'ready' : 'pending', 'text-cyan-200'],
                      ['Stablecoin positions', `${activeBalances.length}`, 'text-violet-200'],
                      ['Earn deposits', `${vaultPositions.positions.length}`, 'text-emerald-200'],
                      ['Execution mode', isDemoMode ? 'demo' : 'wallet', 'text-emerald-200'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                        <span className="text-xs text-white/40">{label}</span>
                        <span className={`font-mono text-xs ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="space-y-6">

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
                selectedCandidate={selectedScoredVault}
                depositAmount={depositAmount}
                onDepositAmountChange={handleDepositAmountChange}
                onSelectCandidate={handleCandidateSelect}
                onExecute={recommendation.type === 'recommended' && !isDemoMode ? handleAnalyze : undefined}
                isLoadingQuote={isLoadingQuote}
              />
            )}

            {/* Demo mode note on recommendation */}
            {recommendation && recommendation.type === 'recommended' && isDemoMode && !worthItAnalysis && (
              <div className="card border-white/10 p-4">
                <p className="text-xs text-white/45">
                  In demo mode, execution is disabled. Connect a wallet with real stablecoins to execute moves.
                </p>
              </div>
            )}

            {/* Quote error */}
            {(quoteError || executionError) && (
              <div className="card border-white/10 p-4">
                <p className="font-mono text-sm text-white/70">
                  {quoteError ? `Quote error: ${quoteError}` : `Execution error: ${executionError}`}
                </p>
                {quoteError && (
                  <button
                    onClick={() => { setQuoteError(null); handleAnalyze() }}
                    className="mt-3 text-xs text-[#00d4aa] hover:opacity-80"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Screen 4: Worth-It Analysis */}
            {worthItAnalysis && activeMandate && !showExecutionTracker && !showStoryCard && (
              <div className="space-y-6">
                <WorthItCard
                  analysis={worthItAnalysis}
                  mandateName={activeMandateName ?? 'Custom mandate'}
                  onExecute={worthItAnalysis.verdict === 'approved' ? handleExecute : undefined}
                  isExecuting={isBusy}
                  actionLabel={executeButtonLabel}
                />
                <ScenarioSimulator analysis={worthItAnalysis} />
              </div>
            )}

            {/* Worth-it refusal story card */}
            {worthItAnalysis && worthItAnalysis.verdict === 'refused' && activeMandate && selectedScoredVault && (
              <YieldStoryCard
                analysis={worthItAnalysis}
                mandateName={activeMandateName ?? 'Custom mandate'}
                vaultName={selectedScoredVault.vault.name}
                protocolName={selectedScoredVault.vault.protocol.name}
                chainId={selectedScoredVault.vault.chainId}
                vaultAddress={selectedScoredVault.vault.address}
                vaultNetwork={selectedScoredVault.vault.network}
                protocolUrl={selectedScoredVault.vault.protocol.url}
                isRedeemable={selectedScoredVault.vault.isRedeemable}
              />
            )}

            {/* Screen 5: Execution Tracker */}
            {showExecutionTracker && selectedScoredVault && (
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
                vaultName={selectedScoredVault!.vault.name}
                protocolName={selectedScoredVault!.vault.protocol.name}
                chainId={selectedScoredVault!.vault.chainId}
                txHash={activeRouteHash}
                vaultAddress={selectedScoredVault!.vault.address}
                vaultNetwork={selectedScoredVault!.vault.network}
                protocolUrl={selectedScoredVault!.vault.protocol.url}
                isRedeemable={selectedScoredVault!.vault.isRedeemable}
                portfolioVerification={portfolioVerification}
              />
            )}

            {/* Loading state for recommendation */}
            {activeMandate && !recommendation && (earnData.isLoading || !isBalanceReady) && (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#00d4aa]" />
                  <p className="text-sm text-white/50">Scanning vaults against your strategy...</p>
                </div>
              </div>
            )}
              </section>
            </div>
          </>
        ) : (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#121212]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="#00d4aa" strokeWidth="1.5"/>
                <path d="M16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14C14 13.4477 14.4477 13 15 13C15.5523 13 16 13.4477 16 14Z" fill="#00d4aa"/>
                <path d="M3 9L7 4H17L21 9" stroke="#00d4aa" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Connect your wallet</h2>
            <p className="mb-1 text-sm text-white/50">
              YieldPilot will scan your USDC and USDT balances across Ethereum, Base, Arbitrum, and Optimism.
            </p>
            <p className="text-xs text-white/30">
              Read-only scan. No transactions without your approval.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-white/25">
            Powered by <a href="https://li.fi" target="_blank" rel="noopener noreferrer" className="text-[#00d4aa] hover:opacity-80">LI.FI</a> Earn Data API + Composer
          </p>
        </div>
      </main>
    </>
  )
}
