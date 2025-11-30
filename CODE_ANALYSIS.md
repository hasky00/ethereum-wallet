# Code Analysis: Ethereum Wallet

This document summarizes missing or incomplete functionality observed in the current implementation.

## Web Wallet (`ethereum-wallet.html`)
- **Static pricing with no live market feed**: The interface hardcodes `ETH_PRICE = 2450.00`, so USD values never reflect real-time prices or updates from a provider.【F:ethereum-wallet.html†L625-L792】
- **No QR code generation for receiving funds**: The "Receive" modal renders a placeholder box without generating a QR code for the wallet address, reducing usability for mobile senders.【F:ethereum-wallet.html†L530-L566】
- **Seed phrase shown in alert without secure backup flow**: New wallets expose the mnemonic via `alert` with no confirmation flow, warnings, or suppression in production builds, which is insecure for real users.【F:ethereum-wallet.html†L642-L663】
- **Network/provider assumptions without fallback**: The app always instantiates a Cloudflare RPC provider and does not attempt user wallets (e.g., MetaMask) or handle provider errors beyond console logging, leaving no path to recover from connectivity failures.【F:ethereum-wallet.html†L630-L739】
- **Transaction sending lacks fee controls and feedback**: `sendETH` sends transactions with default gas and no slippage/fee review, and errors are surfaced only via toast messages, which may hide important details like insufficient funds or network mismatch.【F:ethereum-wallet.html†L794-L832】
- **External actions are just links**: Buy/swap/merchant/ATM flows simply open external websites without prefilled parameters, on-chain integration, or validation of user input, so the features act as shortcuts rather than embedded functionality.【F:ethereum-wallet.html†L520-L621】【F:ethereum-wallet.html†L834-L879】
- **Clipboard operations assume permissions**: Copy/paste rely on `navigator.clipboard` without fallbacks for browsers that block clipboard access, which can lead to silent failures when permissions are denied.【F:ethereum-wallet.html†L771-L786】
- **No persistent session or encryption**: Wallets are kept only in memory and there is no encrypted local storage, password/PIN gating, or logout cleanup beyond variable resets, so refreshing the page drops the wallet without clear warning.【F:ethereum-wallet.html†L642-L739】

## CLI Generators (`eth-wallet-generator.js`, `eth-wallet-production.js`)
- **No entropy verification or user confirmation**: Wallet generation returns output immediately without checksum validation of mnemonics or a confirmation prompt that the phrase was written down.【F:eth-wallet-production.js†L12-L82】【F:eth-wallet-generator.js†L12-L93】
- **Production script prints seed phrase despite flag**: Even with `include_seed_phrase: 'no'`, the production script logs the mnemonic to the console, contradicting the intended security posture and exposing keys on shared terminals.【F:eth-wallet-production.js†L12-L82】
- **No persistence or export tooling**: Generated wallets are only printed to stdout; there is no option to save encrypted keystore files (`.json`), write to disk securely, or integrate with hardware wallets.【F:eth-wallet-generator.js†L12-L118】

## Testing and Automation
- **Lack of automated tests**: The `npm test` script merely runs the generator and dumps JSON; there are no unit/integration tests for wallet creation, UI flows, or provider interactions, making regressions hard to detect.【F:package.json†L6-L22】
