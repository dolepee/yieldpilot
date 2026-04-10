import { NextRequest, NextResponse } from 'next/server'
import {
  fallbackParseIntent,
  makeIntentPlan,
  type IntentBalanceSummary,
  type ParsedIntentPayload,
} from '@/lib/intent'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
const BANKR_MODEL = process.env.BANKR_LLM_MODEL || 'deepseek-v3.2'

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

async function parseWithOpenAI(
  prompt: string,
  balances: IntentBalanceSummary[]
): Promise<ParsedIntentPayload | null> {
  if (!process.env.OPENAI_API_KEY) return null

  const balanceSummary = balances.length
    ? balances.map(balance => `${balance.token} ${balance.formatted} on ${balance.chainName}`).join(', ')
    : 'No balances detected'

  const schemaExample = {
    strategyName: 'AI Safety-First Mandate',
    summary: 'Stay in deep, mature stablecoin vaults and refuse routes that take too long to recover.',
    suggestedPreset: 'conservative',
    crossChainAllowed: false,
    sameChainPreferred: true,
    avoidRewardHeavy: true,
    minTvlUsd: 100000000,
    maxBreakEvenDays: 7,
    minApyImprovementPct: 1,
    protocolTierFloor: 8,
    preferredChains: ['base'],
    reasoning: ['Parsed safety-first intent', 'Same-chain preference detected', 'Fast break-even required'],
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You convert natural-language stablecoin yield goals into a structured mandate for a DeFi app. Return JSON only. Do not include markdown. Keep reasoning to 3-4 concise bullets. Use only conservative, balanced, or aggressive for suggestedPreset.',
        },
        {
          role: 'user',
          content: [
            `User prompt: ${prompt}`,
            `Detected balances: ${balanceSummary}`,
            'Output JSON with keys exactly matching this example shape:',
            JSON.stringify(schemaExample),
            'Rules:',
            '- stablecoins only',
            '- minTvlUsd must be an integer number of USD',
            '- maxBreakEvenDays between 3 and 45',
            '- minApyImprovementPct between 0.25 and 10',
            '- protocolTierFloor between 3 and 10',
            '- preferredChains may include ethereum, base, arbitrum, optimism',
          ].join('\n'),
        },
      ],
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') return null

  return safeJsonParse<ParsedIntentPayload>(content)
}

async function parseWithBankr(
  prompt: string,
  balances: IntentBalanceSummary[]
): Promise<ParsedIntentPayload | null> {
  if (!process.env.BANKR_LLM_KEY) return null

  const balanceSummary = balances.length
    ? balances.map(balance => `${balance.token} ${balance.formatted} on ${balance.chainName}`).join(', ')
    : 'No balances detected'

  const schemaExample = {
    strategyName: 'AI Safety-First Mandate',
    summary: 'Stay in deep, mature stablecoin vaults and refuse routes that take too long to recover.',
    suggestedPreset: 'conservative',
    crossChainAllowed: false,
    sameChainPreferred: true,
    avoidRewardHeavy: true,
    minTvlUsd: 100000000,
    maxBreakEvenDays: 7,
    minApyImprovementPct: 1,
    protocolTierFloor: 8,
    preferredChains: ['base'],
    reasoning: ['Parsed safety-first intent', 'Same-chain preference detected', 'Fast break-even required'],
  }

  const response = await fetch('https://llm.bankr.bot/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BANKR_LLM_KEY}`,
      'X-API-Key': process.env.BANKR_LLM_KEY,
    },
    body: JSON.stringify({
      model: BANKR_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You convert natural-language stablecoin yield goals into a structured mandate for a DeFi app. Return JSON only. Do not include markdown. Keep reasoning to 3-4 concise bullets. Use only conservative, balanced, or aggressive for suggestedPreset.',
        },
        {
          role: 'user',
          content: [
            `User prompt: ${prompt}`,
            `Detected balances: ${balanceSummary}`,
            'Output JSON with keys exactly matching this example shape:',
            JSON.stringify(schemaExample),
            'Rules:',
            '- stablecoins only',
            '- minTvlUsd must be an integer number of USD',
            '- maxBreakEvenDays between 3 and 45',
            '- minApyImprovementPct between 0.25 and 10',
            '- protocolTierFloor between 3 and 10',
            '- preferredChains may include ethereum, base, arbitrum, optimism',
          ].join('\n'),
        },
      ],
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') return null

  return safeJsonParse<ParsedIntentPayload>(content)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = String(body.prompt || '').trim()
    const balances = Array.isArray(body.balances) ? (body.balances as IntentBalanceSummary[]) : []

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    const aiParsed = await parseWithBankr(prompt, balances)
      ?? await parseWithOpenAI(prompt, balances)

    if (aiParsed) {
      const plan = makeIntentPlan(aiParsed, prompt, 'ai')
      return NextResponse.json(plan)
    }

    const fallback = fallbackParseIntent(prompt, balances)
    return NextResponse.json(fallback)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse intent.' },
      { status: 500 }
    )
  }
}
