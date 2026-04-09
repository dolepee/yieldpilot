'use client'

import { useEffect, useState } from 'react'
import { fetchAllVaults, fetchChains, fetchProtocols } from '@/lib/earn-api'
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
        const [v, c, p] = await Promise.all([
          fetchAllVaults(),
          fetchChains(),
          fetchProtocols(),
        ])
        if (cancelled) return
        setVaults(v)
        setChains(c)
        setProtocols(p)
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
