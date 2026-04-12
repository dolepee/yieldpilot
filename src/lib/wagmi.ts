import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, base, arbitrum, optimism } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'YieldPilot',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || 'yieldpilot-demo',
  chains: [mainnet, base, arbitrum, optimism],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})
