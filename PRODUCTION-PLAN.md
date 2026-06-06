# Ethereum Wallet — Production Readiness & OAuth Plan

**Repository**: https://github.com/hasky00/ethereum-wallet  
**Goal**: Turn the current excellent client-side prototype into a **publicly usable, trustworthy, and convenient** self-custodial (or user-sovereign) Ethereum wallet web application, with **OAuth login integrated into the create/import wallet flows**.

**Date**: 2026-06  
**Status**: Planning document (ready for review and phased execution)

---

## 1. Executive Summary

The current app is a beautiful, well-documented, security-focused single-file client-side wallet using ethers.js v5. It excels at local key generation and basic send/receive but lacks:

- Persistence across refreshes/devices
- User accounts / convenient login
- Real QR codes
- Production deployment polish
- Cross-device wallet recovery story

This plan makes the app **"ready and available to use"** for real (starting with testnet, then cautious mainnet) while adding **OAuth** for identity, account association, and (optionally) encrypted cross-device backup — **without ever sending raw private keys or seeds to any server** in the recommended path.

**Core Principle (non-negotiable)**: Users remain in control of their keys. OAuth is for *identity and convenience*, not custody.

---

## 2. Current State (Summary from Analysis)

**Strengths**
- Strong self-custodial ethos and documentation (SECURITY.md, WALLET_DOCUMENTATION.md, etc.).
- Good recent improvements: FallbackProvider RPCs, live CoinGecko prices + cache, seed re-type confirmation modal (better than alert), gas estimation + EIP-1559 support, copy fallbacks.
- Vendored ethers + strict CSP (self-contained).
- CLI generators with explicit dev/prod separation and tests that enforce no leakage.
- Beautiful purple UI, responsive, toasts, USD/ETH conversion.

**Gaps (from CODE_ANALYSIS.md + current scan)**
- QR code in Receive is still a literal placeholder.
- No persistence of wallet session (refresh loses everything — user must re-import).
- Open PR #1 (Nov 2025) still open: modal buy/swap links use `window.open` (popup blockers).
- Old `openExchange`/`openDEX` JS functions remain.
- No user accounts or cross-device story.
- Single giant HTML file (1263 lines).
- Uses legacy ethers v5.
- No PWA support, limited error states, no "max" send, basic external actions only.
- CSP and external calls are narrow (good for security, needs expansion for auth).
- No production CI, limited automated tests (only CLI generators), no browser tests.

**Open Work**
- 1 open PR on the "claude" branch for link handling.

---

## 3. Vision & Success Criteria

**Vision**: A delightful, open-source, auditable web wallet that a normal user can:
1. Sign in with Google / GitHub / email (OAuth) in one click.
2. Create a new secure wallet (or import) while logged in.
3. See their wallets associated with their account.
4. Use it on multiple devices after proper recovery/backup.
5. Send small amounts on testnet immediately, and (with warnings) on mainnet later.

**Success Criteria (MVP "Ready to Use")**
- New user can create a wallet via OAuth login in < 90 seconds on first visit.
- Wallet works after page refresh and on a second device (via recovery flow).
- All sensitive operations have clear warnings and confirmations.
- Deployed publicly with professional onboarding, legal notices, and "use at your own risk + testnet first" messaging.
- At least basic QR for receive + improved external actions.
- Clear separation: "This app never sees your seed in plaintext."

---

## 4. Key Architectural Decisions & Recommendations

### 4.1 Custody / Key Management Model (Most Important Decision)

**Recommended Default: "Identity + Sovereign Keys" (Track A)**

- OAuth (Google, GitHub, email/passkey) provides **user identity only**.
- Wallet creation/import remains 100% client-side with `ethers.Wallet.createRandom()` / `fromMnemonic` / private key (current behavior).
- After create/import, the **address + label + metadata** is associated with the authenticated user (stored server-side).
- **Optional encrypted backup**: User can choose to encrypt their seed/mnemonic client-side (with a strong user-chosen passphrase or passkey-derived key) and store only the ciphertext on the server under their user ID. The server **never** sees plaintext.
- On new device: Login with OAuth → see list of associated addresses → decrypt backup locally if they saved one (or manually enter seed).

**Benefits**: Preserves current "your keys, your crypto" branding and audit surface. Minimal new attack surface on the key material.

**Alternative: Embedded / Social Wallets (Track B — for maximum convenience later)**

Integrate a provider such as:
- **Privy** (highly recommended for this use case in 2026)
- Web3Auth
- Dynamic.xyz
- Particle Network

These give "Sign in with Google → instant Ethereum account" using MPC, enclaves, or passkeys. Users can later export the private key/seed for full self-custody.

Use this if the goal is "feels like a real consumer app" rather than a pure self-custodial demo/tool.

**Decision Gate**: In Phase 0 review, explicitly choose Track A (recommended to start) or Track B.

### 4.2 Hosting & Backend Strategy

| Phase | Hosting | Backend? | Notes |
|-------|---------|----------|-------|
| 0 (Polish) | GitHub Pages (current) or Vercel/Netlify static | None | Easiest, matches existing GITHUB_SETUP.md |
| 1+ (Auth) | Vercel (recommended) or Cloudflare Pages + Functions / Supabase | Lightweight (auth + user metadata + optional encrypted blobs) | Edge functions or Supabase Edge Functions / Postgres with RLS are ideal for minimal surface |
| Full | Same + custom domain + CDN | As above | Add proper DB (user, wallets, encrypted_backups tables) |

**Recommendation**: Move hosting to **Vercel** early (easy static + Edge Functions, preview deploys, great DX). Keep GitHub Pages as a static mirror if desired.

### 4.3 Auth Provider Recommendations

**Primary recommendation for Track A**: **Supabase Auth** (Google, GitHub, Email OTP, Passkeys, Magic links). Open-source friendly, generous free tier, excellent RLS for "user can only see their own rows", Postgres for metadata + encrypted blobs.

**Strong alternative**: **Clerk** (excellent React/JS SDKs, passkeys, OAuth, great DX, hosted UI components).

**Avoid for key material**: Anything that would require sending seeds to the provider.

For Track B: Start directly with **Privy** (it includes its own auth + embedded wallets + export flows).

### 4.4 Data Model (Track A)

- `users` (from auth provider): id, email, provider (google|github|email), created_at
- `user_wallets`: user_id, address (checksummed), label, derivation_path (if relevant), created_at, last_used_at, is_backed_up (bool)
- `encrypted_backups` (optional): user_id, wallet_address, ciphertext (base64 or json), encryption_method ("user-passphrase-v1" | "passkey-v1"), created_at

**Never store**: plaintext seed, private key, or anything decryptable by the server.

---

## 5. Phased Roadmap

### Phase 0: Foundation Polish — Make the Current App Actually Usable (1–2 weeks)

Ship a production-quality **static** version that people can bookmark and use today on testnet.

**Must-do items** (many from CODE_ANALYSIS + recent analysis):
- Merge or re-implement the open PR #1 (proper `<a>` links in buy/swap modals with `rel="noopener noreferrer"`).
- Implement real QR code generation in the Receive modal (add a small dependency or pure-JS canvas implementation; update CSP `img-src` or use data:).
- Add PWA manifest (`manifest.json`), icons, `apple-mobile-web-app`, basic service worker (cache shell + price data).
- Prominent, persistent "Experimental / Testnet recommended / Not audited / Use at your own risk" banners + disclaimers on every sensitive action.
- Improve Send flow: show estimated gas + total cost, "Max" button (respect gas buffer), better insufficient funds / network mismatch errors, tx link to explorer after send.
- Add basic persistence warning + "Remember this session in this browser (local only, 24h)" using encrypted session storage (still no cloud).
- Fix small code smells (duplicate `fallbackCopyText`, remaining old `openExchange` functions).
- Update all documentation (README, SECURITY.md, add `PRIVACY.md` stub, update CSP explanation).
- Add GitHub Actions CI: run `npm test` (after install), basic HTML/JS lint if possible, build check.
- Deploy publicly (GitHub Pages or Vercel) + set custom domain if owned. Update repo description, topics, website link.
- Add first-time user onboarding (simple modal tour or progressive hints).
- Update CSP as needed for QR (if external lib) and any new static assets.

**Deliverable**: Public URL that works great for a logged-out user doing create → backup seed (re-type) → send on Sepolia.

### Phase 1: OAuth Identity Layer (Core Request) — "Login to Create & Import" (2–4 weeks)

Add user accounts so that "Create Wallet" and "Import Wallet" are associated with a persistent identity.

**Steps**:
1. Choose auth provider (Supabase or Clerk recommended) and create project/app.
2. Update CSP significantly (add provider auth domains, storage, any iframe/popup origins, callback domains). Document the expansion.
3. Add "Sign in with Google / GitHub / Email" UI (top bar or prominent on landing/create screen). Use the provider's hosted UI or components when possible.
4. After successful auth: show user avatar/email + "Account" / "My Wallets" entry point. Store minimal session (JWT or provider session).
5. Refactor create/import flows:
   - When **not** logged in: current behavior (fully local, "Sign in to save this wallet to your account" prompt after creation).
   - When **logged in**: after successful create (post seed confirmation) or import (validation), call backend to `POST /api/wallets` with `{ address, label?, created_via: "oauth-create" | "import" }`.
6. New "My Wallets" screen (behind login): list of associated addresses (from server), ability to "Load into this session", rename, "Remove from account" (does not delete on-chain).
7. "Disconnect" clears local `wallet` + provider but keeps server association.
8. Update toasts, modals, and copy throughout to reference the logged-in account where relevant.
9. Add basic "last used" and "created" timestamps.

**Important messaging**: "Signing in lets you associate addresses with your account for convenience. Your private keys and seed phrases are **never** sent to the server."

**Deliverable**: User can log in, click Create Wallet (or Import), go through the existing secure flow, and later see that wallet listed under "My Wallets" after refresh/login on another device (address only).

### Phase 2: Encrypted Cross-Device Backup & Recovery (The "It follows me" feature) (2–3 weeks)

This is what makes OAuth + create/import truly powerful.

**Flow**:
- During/after create or import (while logged in), offer optional "Back up this wallet to your account (encrypted)".
- User sets (or is strongly encouraged to set) a strong backup passphrase.
- Client encrypts the mnemonic (and/or private key) using a strong KDF (e.g. scrypt or argon2 via a small lib or Web Crypto + PBKDF2 as fallback) + the passphrase.
- POST only the ciphertext + method/version to the backend.
- On a new device, after OAuth login: "Recover wallets" shows the list + a "Decrypt backup" button per wallet that prompts for the passphrase and decrypts locally only.
- Never auto-decrypt; always require user action for the plaintext.

**Implementation notes**:
- Use Web Crypto API where possible for auditability (or a well-reviewed small lib like `tweetnacl` + scrypt).
- Store `encryption_method` so future upgrades are possible.
- Add rate limiting and abuse protection on backup/recovery endpoints.
- Clear UI copy: "Your encrypted backup is stored on our servers. Only you (with your passphrase) can decrypt it. We cannot recover your funds if you lose the passphrase."

**Deliverable**: End-to-end story: Create on Device A while logged in + back up → log in on Device B → recover the wallet into the session by providing passphrase.

### Phase 3: Production Hardening, Mainnet Readiness & Polish (ongoing)

- Backend (if using one): proper schema, Row Level Security (or equivalent), encryption at rest for ciphertexts, minimal logging, no PII in logs where possible, input validation, authz checks on every endpoint.
- Add support for multiple networks per wallet or per-user default.
- Optional: "Connect external wallet" (MetaMask / WalletConnect) as a view-only or alternative signer (future-proofs toward account abstraction).
- Legal: Professional Privacy Policy + updated Terms (especially around backups and what data is collected from OAuth). Add a real security contact.
- Error tracking (privacy-respecting, e.g. self-hosted Sentry or Axiom with sampling) + basic uptime checks for key RPCs / price API.
- Better onboarding, funding flows (testnet faucet buttons that open or proxy), educational tooltips.
- Accessibility pass, more languages if desired, dark/light if the purple theme allows.
- Dependency updates (consider ethers v6 migration in a dedicated branch — breaking but worthwhile).
- Security review / bug bounty note (even lightweight).
- Mainnet launch with extra friction (explicit "I understand this is real money" confirmations, perhaps small default gas limits or education interstitials).

### Phase 4: Advanced / Future (post-MVP)

- Full Track B evaluation (Privy etc.) if user demand for "I don't want to manage a seed at all".
- Token (ERC-20) support, basic NFT display, tx history (via indexer or direct RPC + caching).
- Hardware wallet integration hints or WalletConnect.
- Mobile native wrapper (Capacitor / TWA).
- Social recovery or multi-sig guidance / integration.

---

## 6. Granular PR / Task Breakdown (Suggested Order)

1. **PR: Close the open landing page modal links issue** (or cherry-pick the claude branch work).
2. **PR: Real QR code in Receive modal** (pure or minimal dep + CSP update + tests).
3. **PR: PWA + installability + prominent experimental banners + docs refresh**.
4. **PR: Improve Send UX** (gas preview, Max, better errors, explorer links).
5. **PR: Auth provider scaffolding** (choose provider, add sign-in button + session handling, no wallet changes yet).
6. **PR: Associate created/imported wallets with logged-in user** (backend endpoints + UI "My Wallets" list + load flow).
7. **PR: Encrypted backup & recovery flow** (client crypto + storage + decrypt UI).
8. **PR: CI + basic E2E smoke (Playwright or simple) + hosting migration to Vercel (if chosen)**.
9. **PR: Legal pages (Privacy, ToS update), security contact, CSP documentation**.
10. **Follow-ups**: Ethers v6, token support, external wallet connect, etc.

Use GitHub Projects / Milestones to track. Small PRs preferred for reviewability.

---

## 7. Risks, Mitigations & Trade-offs

- **Perception risk** ("Now it has a server, is it still self-custodial?"): Mitigate with extremely clear language in UI, docs, and marketing. "OAuth for identity. Keys stay yours."
- **OAuth account compromise**: Users should use strong/passkey-protected identity providers. Re-auth or additional confirmation for backup decryption / export.
- **Passphrase loss for encrypted backups**: Same as seed loss today — permanent. Make this *very* explicit. Offer "download encrypted backup file" as an extra local copy.
- **CSP expansion**: Document every added origin and why. Prefer providers that work well with strict policies.
- **Scope / security surface creep**: Strict phase gates. Do not store any decryptable key material server-side. Regular dependency + secret scans.
- **Ethers v5 legacy**: Plan a migration branch early; v6 has better tree-shaking and modern APIs but different provider/tx interfaces.
- **Hosting cost / vendor lock**: Start with generous free tiers (Supabase, Vercel hobby, Clerk free). Keep data model portable.
- **Regulatory**: Crypto wallet UIs have gray areas in some jurisdictions. Strong disclaimers + no custody claims.

---

## 8. Recommended Immediate Next Steps

1. **Review & decide**:
   - Track A (identity + sovereign keys + optional encrypted backup) vs Track B (embedded social wallets).
   - Primary auth provider (Supabase vs Clerk vs other).
   - Hosting target for Phase 1+ (Vercel recommended).

2. **Kick off Phase 0** (can start immediately, low risk):
   - I can implement the open PR resolution + real QR + PWA + banners in a branch.
   - Deploy the polished static version publicly.

3. **Create supporting artifacts**:
   - `PRIVACY.md`
   - Updated `SECURITY.md` with new data flows.
   - Architecture diagram (Mermaid) for the auth + backup flow.
   - Threat model appendix.

4. **Set up infrastructure** (after decision):
   - Auth provider project/app.
   - Backend project (Supabase project or Vercel + Edge Functions + DB).
   - Preview/staging environment.

5. **Community / visibility**:
   - Update repo description and README with the new vision.
   - Post in relevant places once Phase 0 is live ("looking for early testers on Sepolia").

---

## 9. Non-Functional Requirements

- **Performance**: Keep initial load reasonable (the current vendored ethers is already the heavy part; consider code-splitting or dynamic import for auth code).
- **Accessibility**: WCAG AA for core flows.
- **Privacy**: Minimize data collected. OAuth data only what's necessary for identity. No analytics that fingerpints without consent.
- **Auditability**: As much code as possible should remain in the repo and easy to review. Avoid heavy closed-source SDKs in the critical path if possible (or clearly isolate them).
- **Testability**: Expand CLI tests; add browser-based tests for the new flows.

---

## 10. Appendix (To Be Expanded)

- Current CSP vs proposed CSP per phase.
- Example user journeys (text + screenshots placeholders).
- Sample backend schema (SQL).
- Threat model updates.
- Cost estimate (auth + hosting + RPCs) for first 1000 MAU.
- Comparison table of Privy / Web3Auth / Supabase+custom vs pure local.

---

**This plan is designed to be executed incrementally with review at each phase gate.**

If you'd like, I can:
- Immediately create a GitHub branch + commit this plan document to your repo.
- Start implementing Phase 0 items (QR, PWA, PR fixes, banners) in isolated worktrees or a single branch.
- Set up the auth provider scaffolding once you pick Supabase/Clerk/etc.
- Refine any section based on your priorities (e.g. "I want the magical embedded wallet experience as fast as possible" or "I want to stay 100% static + client-side forever").

Just say the word and we'll turn this plan into shipping code.

*Your keys, your crypto. Let's make it actually usable.* 🔐🚀
