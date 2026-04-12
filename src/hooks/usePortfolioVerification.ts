'use client'

import { useEffect, useState } from 'react'
import type { Vault } from '@/lib/earn-api'

export interface PortfolioVerification {
  isLoading: boolean
  matched: boolean
  checked: boolean
  positionCount: number
  error: string | null
}

function getPositions(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.positions)) return record.positions
  if (Array.isArray(record.data)) return record.data
  if (record.portfolio) return getPositions(record.portfolio)
  return []
}

export function usePortfolioVerification(
  address: string | undefined,
  vault: Vault | null | undefined,
  enabled: boolean
): PortfolioVerification {
  const [state, setState] = useState<PortfolioVerification>({
    isLoading: false,
    matched: false,
    checked: false,
    positionCount: 0,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !address || !vault) {
      setState({ isLoading: false, matched: false, checked: false, positionCount: 0, error: null })
      return
    }

    let cancelled = false
    const targetVault = vault

    async function load() {
      setState((current) => ({ ...current, isLoading: true, error: null }))
      try {
        const response = await fetch(`/api/portfolio?address=${address}`)
        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || `Portfolio scan failed: ${response.status}`)
        }

        const positions = getPositions(data)
        const haystack = JSON.stringify(data).toLowerCase()
        const matched = haystack.includes(targetVault.address.toLowerCase())
          || haystack.includes(targetVault.name.toLowerCase())
          || haystack.includes(targetVault.slug.toLowerCase())

        if (!cancelled) {
          setState({
            isLoading: false,
            matched,
            checked: true,
            positionCount: positions.length,
            error: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            isLoading: false,
            matched: false,
            checked: true,
            positionCount: 0,
            error: error instanceof Error ? error.message : 'Portfolio scan failed',
          })
        }
      }
    }

    const timeout = window.setTimeout(load, 2500)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [address, enabled, vault])

  return state
}
