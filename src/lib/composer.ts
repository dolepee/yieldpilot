import { COMPOSER_API_BASE } from './constants'

export interface ComposerQuote {
  type: string
  id: string
  tool: string
  action: {
    fromChainId: number
    toChainId: number
    fromToken: { address: string; symbol: string; decimals: number; priceUSD: string }
    toToken: { address: string; symbol: string; decimals: number; priceUSD: string }
    fromAmount: string
    toAmount: string
    slippage: number
  }
  estimate: {
    fromAmount: string
    toAmount: string
    toAmountMin: string
    approvalAddress: string
    gasCosts: { type: string; estimate: string; amountUSD: string; token: { symbol: string } }[]
    feeCosts: { type: string; amount: string; amountUSD: string; token: { symbol: string } }[]
    executionDuration: number
  }
  transactionRequest: {
    to: string
    data: string
    value: string
    from: string
    chainId: number
    gasLimit: string
    gasPrice?: string
  }
}

export interface QuoteError {
  message: string
  code?: string
}

// Fetch a Composer quote for depositing into a vault
export async function fetchComposerQuote(params: {
  fromChainId: number
  toChainId: number
  fromToken: string
  toToken: string // vault address
  fromAddress: string
  toAddress: string
  fromAmount: string // in smallest unit
  apiKey: string
}): Promise<{ quote: ComposerQuote | null; error: string | null }> {
  const searchParams = new URLSearchParams({
    fromChain: String(params.fromChainId),
    toChain: String(params.toChainId),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    fromAmount: params.fromAmount,
  })

  try {
    const res = await fetch(`${COMPOSER_API_BASE}/v1/quote?${searchParams}`, {
      headers: {
        'x-lifi-api-key': params.apiKey,
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return { quote: null, error: err.message || `Quote failed: ${res.status}` }
    }

    const data = await res.json()
    return { quote: data, error: null }
  } catch (e) {
    return { quote: null, error: e instanceof Error ? e.message : 'Failed to fetch quote' }
  }
}

// Extract total route cost from a quote
export function extractRouteCost(quote: ComposerQuote): {
  gasCostUsd: number
  feeCostUsd: number
  totalCostUsd: number
} {
  const gasCostUsd = (quote.estimate.gasCosts || [])
    .reduce((sum, g) => sum + Number(g.amountUSD || 0), 0)

  const feeCostUsd = (quote.estimate.feeCosts || [])
    .reduce((sum, f) => sum + Number(f.amountUSD || 0), 0)

  return {
    gasCostUsd,
    feeCostUsd,
    totalCostUsd: gasCostUsd + feeCostUsd,
  }
}

// Poll transaction status
export async function pollTransactionStatus(txHash: string, fromChainId: number): Promise<{
  status: string
  substatus?: string
  receiving?: { amount: string; token: { symbol: string } }
}> {
  const params = new URLSearchParams({
    txHash,
    fromChain: String(fromChainId),
  })

  const res = await fetch(`${COMPOSER_API_BASE}/v1/status?${params}`)
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}
