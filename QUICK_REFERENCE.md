# Quick Reference Card

## 🚀 Getting Started (5 minutes)

### Option 1: Web Interface
```bash
# Just open in browser
open ethereum-wallet.html
```

### Option 2: Command Line
```bash
# Install dependencies
npm install ethers@5.7.2

# Generate wallet (production)
node eth-wallet-production.js
```

---

## 📝 Common Tasks

### Create New Wallet
**Web**: Click "Create Wallet" → Write down seed phrase → Done!
**CLI**: `node eth-wallet-production.js`

### Import Wallet
**Web**: Click "Import Wallet" → Enter seed/key → Import
**CLI**: 
```javascript
const wallet = ethers.Wallet.fromMnemonic('your seed phrase');
```

### Check Balance
**Web**: Opens automatically after login
**CLI**: 
```javascript
const balance = await provider.getBalance(address);
console.log(ethers.utils.formatEther(balance));
```

### Send ETH
**Web**: Click "Send" → Enter address & amount → Confirm
**CLI**: 
```javascript
const tx = await wallet.sendTransaction({
  to: '0x...',
  value: ethers.utils.parseEther('0.1')
});
```

---

## 🔐 Security Checklist

### Before Using Wallet
- [ ] Downloaded from official source
- [ ] Verified code integrity
- [ ] Using latest version
- [ ] Device is malware-free

### When Creating Wallet
- [ ] Write seed phrase on paper
- [ ] Verify each word spelling
- [ ] Store in secure location
- [ ] Test recovery before funding

### When Sending ETH
- [ ] Verify recipient address
- [ ] Check amount twice
- [ ] Start with small test
- [ ] Wait for confirmation

### Ongoing
- [ ] Never share seed phrase
- [ ] Keep software updated
- [ ] Use hardware wallet for large amounts
- [ ] Monitor transactions regularly

---

## 🆘 Emergency Guide

### Lost Access?
1. Do you have seed phrase? → Restore wallet
2. No seed phrase? → **Funds are lost permanently**
3. Never trust "recovery services"

### Suspicious Activity?
1. Move funds to new wallet immediately
2. Check transaction history on Etherscan
3. Report to relevant authorities
4. Document all evidence

### Compromised Seed?
1. **Create new wallet immediately**
2. Transfer all funds to new address
3. Never reuse compromised wallet
4. Review how compromise occurred

---

## 🔗 Important Links

### Block Explorers
- Mainnet: https://etherscan.io
- Sepolia: https://sepolia.etherscan.io

### Get Testnet ETH
- https://sepoliafaucet.com
- https://faucet.quicknode.com/ethereum/sepolia

### Gas Trackers
- https://etherscan.io/gastracker
- https://ethereumprice.org/gas/

### RPC Endpoints
- Cloudflare: `https://cloudflare-eth.com`
- Your own node: Recommended for privacy

---

## 💡 Pro Tips

### Gas Optimization
- Send during low activity (weekends, early morning UTC)
- Use Layer 2 for small amounts (Arbitrum, Optimism)
- Set custom gas price for non-urgent transactions

### Security
- Use hardware wallet for >$10,000
- Consider multi-sig for shared funds
- Keep majority in cold storage
- Small amounts in hot wallet only

### Backup Strategy
- Primary: Metal backup plate
- Secondary: Paper in fireproof safe
- Tertiary: Split backup in 2-3 locations
- Test recovery annually

### Testing
- Always test with 0.01 ETH first
- Verify on testnet before mainnet
- Use address book for frequent recipients
- Save transaction hashes

---

## 📊 Network Information

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 1 | https://cloudflare-eth.com |
| Sepolia | 11155111 | https://rpc.sepolia.org |
| Arbitrum | 42161 | https://arb1.arbitrum.io/rpc |
| Optimism | 10 | https://mainnet.optimism.io |
| Polygon | 137 | https://polygon-rpc.com |
| Base | 8453 | https://mainnet.base.org |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Transaction fails | Increase gas price |
| Can't connect | Check RPC endpoint |
| Balance not showing | Wait for sync, refresh |
| Wrong network | Switch to correct chain ID |
| Import fails | Verify seed/key format |

---

## 📞 Get Help

### Documentation
1. README.md - Overview
2. WALLET_DOCUMENTATION.md - Detailed guide
3. SECURITY.md - Security policy

### Community
- GitHub Issues (non-security)
- Ethereum Stack Exchange
- r/ethereum subreddit

### Security Issues
- See SECURITY.md for reporting
- **Never** post private keys publicly

---

## 🎯 Command Reference

### Development
```bash
npm install              # Install dependencies
node eth-wallet-generator.js  # Generate test wallet
npm run generate         # Same as above
npm test                # Run tests
```

### Production
```bash
node eth-wallet-production.js  # Generate real wallet
npm run generate:prod          # Same as above
```

### Useful Commands
```bash
# Check balance
node -e "const ethers = require('ethers'); const p = new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com'); p.getBalance('0xYOUR_ADDRESS').then(b => console.log(ethers.utils.formatEther(b)))"

# Get gas price
node -e "const ethers = require('ethers'); const p = new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com'); p.getGasPrice().then(g => console.log(ethers.utils.formatUnits(g, 'gwei') + ' gwei'))"
```

---

## ⚠️ Remember

🔴 **NEVER share your seed phrase**
🔴 **NEVER share your private key**
🔴 **Write seeds on paper only**
🔴 **No one can recover lost seeds**
🔴 **Test before large transfers**

---

## 📱 Quick Actions

### I want to...
- **Create wallet**: Web or `node eth-wallet-production.js`
- **Check balance**: Open ethereum-wallet.html
- **Send ETH**: Web interface → Send button
- **Buy ETH**: Web interface → Buy button → Choose exchange
- **Find ATM**: Web interface → ATMs button
- **Get help**: See WALLET_DOCUMENTATION.md

---

**Print this page for quick reference! 📄**

Last updated: November 2025
