'use client'

import { useEffect, useState, useRef } from 'react'

export type LifiStatusState = 'idle' | 'polling' | 'PENDING' | 'DONE' | 'FAILED' | 'NOT_FOUND'

export interface LifiStatusResult {
  status: LifiStatusState
  substatus?: string
  error: string | null
}

export function useLifiStatus(txHash: string | undefined, fromChainId: number | undefined): LifiStatusResult {
  const [status, setStatus] = useState<LifiStatusState>('idle')
  const [substatus, setSubstatus] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!txHash || !fromChainId) {
      setStatus('idle')
      return
    }

    setStatus('polling')
    setError(null)

    async function poll() {
      try {
        const params = new URLSearchParams({
          txHash: txHash!,
          fromChain: String(fromChainId),
        })
        const res = await fetch(`https://li.quest/v1/status?${params}`)
        if (!res.ok) {
          if (res.status === 404) {
            setStatus('NOT_FOUND')
            return
          }
          throw new Error(`Status check failed: ${res.status}`)
        }

        const data = await res.json()
        const s = data.status as string

        if (s === 'DONE' || s === 'COMPLETED') {
          setStatus('DONE')
          setSubstatus(data.substatus)
          if (intervalRef.current) clearInterval(intervalRef.current)
        } else if (s === 'FAILED') {
          setStatus('FAILED')
          setSubstatus(data.substatus)
          if (intervalRef.current) clearInterval(intervalRef.current)
        } else {
          setStatus('PENDING')
          setSubstatus(data.substatus)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Status polling failed')
      }
    }

    // Poll immediately, then every 5 seconds
    poll()
    intervalRef.current = setInterval(poll, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [txHash, fromChainId])

  return { status, substatus, error }
}
