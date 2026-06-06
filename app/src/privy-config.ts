// Phase 1 Privy configuration
// Replace with your real App ID from https://dashboard.privy.io
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id-here';

export const privyConfig = {
  appearance: {
    theme: 'dark' as const,
    accentColor: '#9d4edd', // Matches our original purple
    logo: 'https://your-logo-if-any.svg', // optional
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets' as const,
  },
  // Add more chains as needed
  supportedChains: [
    // import { sepolia, mainnet } from 'viem/chains';
  ],
};
