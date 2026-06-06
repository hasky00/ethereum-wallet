# Phase 1: Track B — Privy Embedded Wallets + Unified Auth

**Decision**: We are going with **Track B using Privy**.

Privy excels at:
- Social + passwordless login (Google, GitHub, email, SMS, passkeys, etc.)
- Creating and managing **embedded EVM wallets** (users get a real Ethereum address they control)
- Excellent DX with React hooks + JS SDK
- Built-in support for exporting private keys / seed phrases (preserves the "self-custodial" escape hatch)
- Smart wallet features, gas sponsorship (optional), and multi-chain
- Stronger unified experience than rolling your own with Supabase + Clerk + ethers

This moves us from "pure client-side ethers demo" to a **production-grade wallet experience** while still allowing users to export and take full custody.

## High-Level Architecture (Phase 1)

- **Auth + Wallet**: Fully handled by Privy (`@privy-io/react-auth` + embedded wallets).
- **UI**: Keep the beautiful purple theme and existing flows (Create/Import/Send/Receive/Buy/Swap etc.).
- **Ethers / Transactions**: Use the wallet provided by Privy (via `getEthereumProvider()` or Privy's connector) + ethers.js (we'll upgrade to v6 later).
- **Legacy mode** (optional): Keep the old pure-ethers path behind a "Classic / Self-custodial only" toggle for power users (future).
- **Hosting**: Vercel (already in progress from Phase 0).

## Recommended Project Evolution

The current single-file `ethereum-wallet.html` is great for Phase 0 but becomes painful with React + Privy.

**Proposed structure for Phase 1+**:

```
ethereum-wallet/
├── src/                     # New modern app (Vite + React + TS)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── WalletDashboard.tsx   (port the current beautiful UI)
│   │   ├── SendModal.tsx
│   │   ├── ReceiveModal.tsx (with real QR)
│   │   └── ...
│   ├── lib/privy.ts
│   ├── lib/ethers.ts
│   └── styles/ (port the existing CSS or use Tailwind + custom)
├── public/
│   └── (manifest, icons, sw.js from Phase 0)
├── ethereum-wallet.html   # Keep as "Classic mode" / legacy reference (or remove later)
├── index.html             # Vite entry
├── vite.config.ts
├── package.json
└── vercel.json
```

We can start **small**:
- Use Vite + React + TypeScript (lightweight).
- Port the existing CSS variables + components as React components (or keep a lot of the markup).
- Add Privy as the new login gate.
- The "Create Wallet" and "Import Wallet" buttons become "Login with Google / GitHub" (Privy handles embedded wallet creation behind the scenes).

## Step-by-Step Scaffolding (Start Here)

### 1. Privy Setup (do this first)
1. Go to https://dashboard.privy.io
2. Create a new app.
3. Enable **Google**, **GitHub**, **Email**, and **Passkeys** (recommended).
4. Under **Embedded Wallets** → enable for EVM (Ethereum, Sepolia, etc.).
5. Note your **App ID** (`NEXT_PUBLIC_PRIVY_APP_ID` or `VITE_PRIVY_APP_ID`).
6. Add your domains (localhost + your vercel.app domain) in Allowed Origins.

### 2. Install Dependencies (in the new src setup)
```bash
npm create vite@latest . -- --template react-ts
npm install @privy-io/react-auth ethers@6
npm install -D tailwindcss postcss autoprefixer   # optional but nice for theming
```

### 3. Basic Privy Provider Setup (src/main.tsx)
```tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains'; // or mainnet

<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    appearance: {
      theme: 'dark',
      accentColor: '#9d4edd', // match our purple
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets', // auto-create for new users
    },
    supportedChains: [sepolia /*, mainnet */],
  }}
>
  <App />
</PrivyProvider>
```

### 4. Login + Embedded Wallet Flow (example)
```tsx
import { usePrivy, useWallets } from '@privy-io/react-auth';

function LoginScreen() {
  const { login, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  if (!ready) return <div>Loading Privy...</div>;

  if (!authenticated) {
    return <button onClick={login}>Sign in with Google / GitHub / Email</button>;
  }

  if (embeddedWallet) {
    console.log('Your address:', embeddedWallet.address);
    // You can now use this with ethers:
    // const provider = await embeddedWallet.getEthereumProvider();
    // const ethersProvider = new ethers.BrowserProvider(provider);
  }

  return <WalletDashboard address={embeddedWallet?.address} />;
}
```

### 5. Using the Wallet for Transactions (Send flow)
```tsx
const { wallets } = useWallets();
const wallet = wallets[0];

const provider = await wallet.getEthereumProvider();
const ethersProvider = new ethers.BrowserProvider(provider);
const signer = await ethersProvider.getSigner();

const tx = await signer.sendTransaction({
  to: recipient,
  value: ethers.parseEther(amount),
});
```

Privy also gives you `wallet.getEthersProvider()` in some versions — check current docs.

### 6. Export / Self-Custody Escape Hatch (very important)
Privy makes it easy for users to export:
- Private key
- Seed phrase (for the embedded wallet)

Add a prominent "Export wallet" / "Take full custody" button in settings. This preserves the original spirit of the project.

```tsx
const { exportWallet } = usePrivy();
<button onClick={() => exportWallet()}>Export private key / seed</button>
```

### 7. CSP Updates (important)
When moving to a built app on Vercel, update CSP to include Privy domains:

```
connect-src 'self' https://*.privy.io https://auth.privy.io ... (your RPCs + CoinGecko)
script-src 'self' 'unsafe-inline' https://*.privy.io
frame-src https://*.privy.io
```

### 8. Theming
Privy allows heavy customization of the login modal to better match our purple gradient theme.

## Suggested First Commits / PRs for Phase 1

1. **Scaffolding PR** (this branch)
   - Add Vite + React + TS skeleton
   - Add PrivyProvider + basic login button
   - Port the existing CSS variables + a couple of components (logo, balance card)
   - Show the connected wallet address from Privy

2. **Wallet UI Integration PR**
   - Replace old Create/Import with Privy login
   - Wire Send/Receive using the embedded wallet + ethers
   - Re-implement the beautiful modals as React components
   - Real QR (we already have good code from Phase 0)

3. **Export + Polish PR**
   - Export private key flow
   - Network switching via Privy
   - "Classic mode" toggle (optional)

4. **Deployment PR**
   - Vercel config + env var for `VITE_PRIVY_APP_ID`
   - Update README with new login experience

## Vercel + Privy Notes
- Add `VITE_PRIVY_APP_ID` in Vercel dashboard (Project Settings → Environment Variables).
- Privy works excellently with Vercel preview deployments (just add the preview domains in Privy dashboard too).

## Risks / Trade-offs of Track B + Privy
- **Less "pure" self-custodial** on first use (user doesn't see a seed phrase immediately).
- **Stronger dependency** on Privy (but they are reputable and allow export).
- **Bigger bundle** (React + Privy SDK).
- **Better UX and security** for most users (MFA, passkeys, recovery, etc.).

This is the right call if the goal is a **usable, modern wallet product**.

---

**Next immediate actions I can take**:
- Scaffold a minimal Vite + React + Privy app in `src/`
- Port the logo + main color scheme
- Add a working "Login with Privy" that shows the embedded address
- Update the main PRODUCTION-PLAN.md with this decision locked in

Would you like me to start building the actual code skeleton now (Vite + Privy login + address display), or first just expand the docs and architecture?

Also — should we keep the old `ethereum-wallet.html` as a "Classic self-custodial" experience alongside the new Privy version, or treat the Privy version as the future of the project?