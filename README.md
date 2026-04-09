# YieldPilot

AI mandate-driven stablecoin yield copilot. Built for the DeFi Mullet Hackathon #1 (AI x Earn track).

**Live:** https://yieldpilot-iota.vercel.app

## What It Does

YieldPilot does not just find the highest yield. It enforces your rules.

1. Connect your wallet
2. App scans your USDC/USDT balances across Ethereum, Base, Arbitrum, and Optimism
3. Choose a yield mandate (Conservative, Balanced, or Aggressive)
4. App filters 659+ vaults against your mandate constraints
5. App fetches a Composer quote and calculates whether the move is economically worth it
6. If the move passes your mandate and breaks even fast enough: execute
7. If not: explicitly refuse and explain why your funds stay put

The core differentiator is the refusal logic. YieldPilot says "no" when a move is not worth it.

## How It Uses the Earn API

### Earn Data API (earn.li.fi)

- `GET /v1/earn/vaults` with full pagination across all 659+ vaults
- `GET /v1/earn/chains` for supported chain metadata
- `GET /v1/earn/protocols` for protocol metadata and maturity scoring
- `GET /v1/earn/portfolio/:address/positions` for existing vault positions

### Composer (li.quest)

- `GET /v1/quote` to build deposit routes and extract gas/fee cost data
- `GET /v1/status` to track execution progress after deposit
- Cost data feeds the break-even analysis engine

### On-Chain Reads

- viem `readContract` for USDC/USDT balances across 4 chains (Ethereum, Base, Arbitrum, Optimism)

## Mandate System

Three presets with typed constraints:

| Mandate | TVL Floor | Max Break-Even | Cross-Chain | Reward-Heavy |
|---|---|---|---|---|
| Conservative | $100M | 7 days | No | Excluded |
| Balanced | $10M | 14 days | Allowed | Allowed |
| Aggressive | $1M | 30 days | Allowed | Allowed |

Each mandate maps to structured fields: `minTvlUsd`, `maxBreakEvenDays`, `protocolTierFloor`, `avoidRewardHeavy`, `crossChainAllowed`, and more.

## Break-Even Engine

Before recommending any move, YieldPilot:

1. Fetches a real Composer quote for the route
2. Extracts total gas + fee cost in USD
3. Calculates APY delta vs current position (or idle at 0%)
4. Computes daily incremental yield
5. Derives break-even days = route cost / daily yield improvement
6. Compares against mandate threshold

If break-even exceeds the mandate limit, the move is refused with a clear explanation.

## Ranking Engine

Deterministic scoring, not LLM-driven. Factors:

- APY level (0-30 points)
- APY stability: 1d vs 30d drift (0-20 points)
- TVL depth (0-20 points)
- Protocol maturity tier (0-15 points)
- Same-chain bonus (0-15 points)

AI is used only for explanation text and the Yield Story card copy, never for vault selection.

## Tech Stack

- Next.js 16 + TypeScript
- wagmi + RainbowKit for wallet connection
- viem for on-chain reads and transaction building
- Tailwind CSS 4
- LI.FI Earn Data API + Composer
- Vercel for deployment

## Quick Start

```bash
git clone https://github.com/dolepee/yieldpilot.git
cd yieldpilot
npm install
cp .env.local.example .env.local  # add your LIFI_API_KEY
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `LIFI_API_KEY` | Composer API key from portal.li.fi |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |

## Project Structure

```
src/
  app/
    page.tsx            # Main app flow
    providers.tsx       # wagmi + RainbowKit
    api/quote/route.ts  # Server-side Composer proxy
  components/
    Header.tsx          # Nav + wallet connect
    WalletSnapshot.tsx  # Stablecoin balance display
    MandatePicker.tsx   # Mandate selection UI
    RecommendationCard.tsx  # Top vault recommendation
    WorthItCard.tsx     # Break-even analysis verdict
    ExecutionTracker.tsx    # Tx status polling
    YieldStoryCard.tsx  # Shareable result card
    EarnStats.tsx       # Vault/chain/APY stats
  hooks/
    useStablecoinBalances.ts  # Multi-chain balance reads
    useEarnData.ts      # Vault/chain/protocol fetch
    useLifiStatus.ts    # Transaction status polling
  lib/
    constants.ts        # Addresses, tiers, config
    earn-api.ts         # Earn Data API client
    composer.ts         # Composer quote client
    mandates.ts         # Mandate types and presets
    ranking.ts          # Deterministic vault ranking
    worth-it.ts         # Break-even analysis
    demo.ts             # Demo mode mock data
    wagmi.ts            # Wallet config
```

## Hackathon

Built for the DeFi Mullet Hackathon #1 by LI.FI.

- Track: AI x Earn
- Duration: April 8-14, 2026
- Prize pool: $5,000 USDC

## License

MIT
