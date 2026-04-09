'use client'

import { useLifiStatus, type LifiStatusState } from '@/hooks/useLifiStatus'

interface ExecutionTrackerProps {
  txHash: string | undefined
  fromChainId: number | undefined
  isSending: boolean
  isConfirming: boolean
  onComplete?: () => void
}

function StepDot({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    )
  }
  return <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
}

function StepRow({ label, sublabel, state }: { label: string; sublabel?: string; state: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <StepDot state={state} />
      <div>
        <p className={`text-sm font-medium ${state === 'pending' ? 'text-gray-600' : 'text-white'}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
      </div>
    </div>
  )
}

export function ExecutionTracker({ txHash, fromChainId, isSending, isConfirming, onComplete }: ExecutionTrackerProps) {
  const { status: lifiStatus } = useLifiStatus(
    txHash && !isConfirming ? txHash : undefined,
    fromChainId
  )

  // Notify parent on completion
  if (lifiStatus === 'DONE' && onComplete) {
    onComplete()
  }

  // Determine step states
  const signState: 'done' | 'active' | 'pending' = txHash ? 'done' : isSending ? 'active' : 'pending'
  const confirmState: 'done' | 'active' | 'pending' = !txHash ? 'pending' : !isConfirming && lifiStatus !== 'idle' ? 'done' : isConfirming ? 'active' : 'pending'

  let routeState: 'done' | 'active' | 'pending' = 'pending'
  if (lifiStatus === 'DONE') routeState = 'done'
  else if (lifiStatus === 'PENDING' || lifiStatus === 'polling') routeState = 'active'

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Executing move</h3>

      <div className="space-y-1">
        <StepRow
          label="Wallet signature"
          sublabel={signState === 'active' ? 'Confirm in your wallet...' : signState === 'done' ? 'Signed' : undefined}
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
        <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-red-400">Route execution failed. Your funds may have been returned to your wallet.</p>
        </div>
      )}
    </div>
  )
}
