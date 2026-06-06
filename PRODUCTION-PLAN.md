# Ethereum Wallet — Production Readiness & OAuth Plan (Updated for Track B + Privy)

**Repository**: https://github.com/hasky00/ethereum-wallet  
**Current Focus**: Phase 1 — Privy Embedded Wallets + Unified Auth (Track B)

---

## Key Decision (June 2026)

**Chosen path: Track B with Privy**

After reviewing options, we selected **Privy** for:
- Best-in-class unified authentication (Google, GitHub, email, passkeys, etc.)
- Excellent embedded EVM wallet management
- Strong export capabilities (users can always take full self-custody)
- Superior developer experience compared to building on top of Supabase + Clerk + raw ethers

This is a deliberate shift from pure client-side sovereign keys toward a more usable embedded wallet model, while still allowing full key export.

See the dedicated file `PHASE1-PRIVY-INTEGRATION.md` for the detailed technical plan, architecture, and scaffolding steps.

## Phase 0 Status (Complete)

- [x] Real QR codes
- [x] PWA support
- [x] Safety banners & disclaimers
- [x] Send UX improvements (Max, fee hints, explorer links)
- [x] Code cleanup + link fixes
- [x] Basic CI
- [x] PRIVACY.md stub

Phase 0 lives on `feat/phase-0-foundation-polish` → PR #3.

## Phase 1 Current Work (Scaffolding)

Branch: `feat/phase-1-oauth-scaffolding`

See `PHASE1-PRIVY-INTEGRATION.md` (just created) which contains:
- Why Privy
- Architecture recommendations (moving from single-file HTML toward Vite + React)
- Exact integration patterns (login, embedded wallet, transactions with ethers, export)
- CSP changes
- Suggested PR breakdown
- Vercel + Privy deployment notes

### Immediate Next Steps (to be executed)

1. Initialize a lightweight Vite + React + TS app (or `app/` subfolder).
2. Add Privy + basic login flow that surfaces the embedded wallet address.
3. Port the existing purple theme / components gradually.
4. Wire the existing "Send / Receive" logic to use the Privy-provided signer.
5. Add prominent export button.
6. Update CSP and environment variable handling for Vercel.

Would you like me to start writing the actual Vite + Privy code skeleton right now?

---

*Last updated after user confirmed Track B + Privy preference.*
