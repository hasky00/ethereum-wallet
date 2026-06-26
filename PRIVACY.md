# Privacy Policy (Stub)

**Ethereum Wallet** is a client-side focused tool.

## What we collect
- **Nothing by default.** The web app runs entirely in your browser.
- When you choose to sign in (future OAuth phases), we receive only the minimal identity information your chosen provider shares (e.g. email or account ID) to associate wallet *addresses* (public data) with your account.
- **We never receive, store, or have access to** your seed phrases, private keys, or the ability to spend your funds.

## Local data
- Price cache (CoinGecko) may be stored in localStorage for offline convenience.
- Wallet state lives only in memory during a session.

## Third parties
- Price data: CoinGecko (public API).
- RPC nodes: Public endpoints (Cloudflare, Ankr, etc.). These see your address and balances when you use the app.
- Future: Authentication provider (e.g. Supabase or Clerk) for identity only.

## Your responsibility
As with any self-custodial tool: you control your keys. We cannot see or recover them.

For the full current behavior, see the in-app banners and SECURITY.md.

*This is a living document. Updated as features (especially accounts + optional encrypted backups) are added in later phases.*
