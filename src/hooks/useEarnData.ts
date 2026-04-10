'use client'

import { useEffect, useState } from 'react'
import type { Vault, EarnChain, EarnProtocol } from '@/lib/earn-api'

export interface EarnData {
  vaults: Vault[]
  chains: EarnChain[]
  protocols: EarnProtocol[]
  isLoading: boolean
  error: string | null
}

export function useEarnData(): EarnData {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [chains, setChains] = useState<EarnChain[]>([])
  const [protocols, setProtocols] = useState<EarnProtocol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetch('/api/earn')
        const data = await res.json()

        if (!res.ok || data.error) {
          throw new Error(data.error || `Earn bootstrap error: ${res.status}`)
        }

        if (cancelled) return
        setVaults(data.vaults)
        setChains(data.chains)
        setProtocols(data.protocols)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load Earn data')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { vaults, chains, protocols, isLoading, error }
}
