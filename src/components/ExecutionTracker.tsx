'use client'

import type { LifiStatusState } from '@/hooks/useLifiStatus'

interface ExecutionTrackerProps {
  txHash: string | undefined
  approvalHash?: string
  approvalRequired: boolean
  isCheckingAllowance: boolean
  isApproving: boolean
  isApprovalConfirming: boolean
  isSendingRoute: boolean
  isRouteConfirming: boolean
  lifiStatus: LifiStatusState
}

function StepDot({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <div className="w-6 h-6 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-[#00d4aa] border-t-transparent animate-spin" />
    )
  }
  return <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
}

function StepRow({ label, sublabel, state }: { label: string; sublabel?: string; state: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <StepDot state={state} />
      <div>
        <p className={`text-sm font-medium ${state === 'pending' ? 'text-white/25' : 'text-white'}`}>{label}</p>
        {sublabel && <p className="font-mono text-xs text-white/40">{sublabel}</p>}
      </div>
    </div>
  )
}

export function ExecutionTracker({
  txHash,
  approvalHash,
  approvalRequired,
  isCheckingAllowance,
  isApproving,
  isApprovalConfirming,
  isSendingRoute,
  isRouteConfirming,
  lifiStatus,
}: ExecutionTrackerProps) {
  // Determine step states
  const approvalState: 'done' | 'active' | 'pending' = !approvalRequired
    ? 'done'
    : approvalHash && !isApprovalConfirming
      ? 'done'
      : isCheckingAllowance || isApproving || isApprovalConfirming
        ? 'active'
        : 'pending'

  const signState: 'done' | 'active' | 'pending' = txHash ? 'done' : isSendingRoute ? 'active' : 'pending'
  const confirmState: 'done' | 'active' | 'pending' = !txHash
    ? 'pending'
    : !isRouteConfirming && lifiStatus !== 'idle'
      ? 'done'
      : isRouteConfirming
        ? 'active'
        : 'pending'

  let routeState: 'done' | 'active' | 'pending' = 'pending'
  if (lifiStatus === 'DONE') routeState = 'done'
  else if (lifiStatus === 'PENDING' || lifiStatus === 'polling') routeState = 'active'

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Executing move</h3>

      <div className="space-y-1">
        {approvalRequired && (
          <StepRow
            label="Token approval"
            sublabel={
              approvalState === 'active'
                ? isCheckingAllowance
                  ? 'Checking allowance...'
                  : isApproving
                    ? 'Confirm approval in your wallet...'
                    : 'Waiting for approval confirmation...'
                : approvalState === 'done'
                  ? 'Allowance ready'
                  : undefined
            }
            state={approvalState}
          />
        )}
        <StepRow
          label="Route signature"
          sublabel={signState === 'active' ? 'Confirm route in your wallet...' : signState === 'done' ? 'Signed' : undefined}
          state={signState}
        />
        <StepRow
          label="Transaction submitted"
          sublabel={confirmState === 'active' ? 'Waiting for block confirmation...' : txHash ? `${txHash.slice(0, 14)}...` : undefined}
          state={confirmState}
        />
        <StepRow
          label="Route complete"
          sublabel={
            lifiStatus === 'DONE' ? 'Deposit confirmed'
            : lifiStatus === 'FAILED' ? 'Route failed'
            : lifiStatus === 'PENDING' ? 'Processing route...'
            : lifiStatus === 'NOT_FOUND' ? 'Waiting for indexing...'
            : undefined
          }
          state={routeState}
        />
      </div>

      {lifiStatus === 'FAILED' && (
        <div className="mt-4 p-3 rounded-md bg-[#1a1a1a] border border-white/10">
          <p className="text-sm text-white/60">Route execution failed. Your funds may have been returned to your wallet.</p>
        </div>
      )}
    </div>
  )
}
