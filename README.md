# 🔐 Ethereum Wallet - Secure Self-Custodial Wallet

A complete Ethereum wallet solution with web interface and secure wallet generation tools following industry best practices and cryptographic standards.

![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## ✨ Features

### 🌐 Web Interface (`ethereum-wallet.html`)
- **Create New Wallet**: Generate secure Ethereum wallets with BIP39 seed phrases
- **Import Wallet**: Import existing wallets via private key or seed phrase
- **Send/Receive ETH**: Full transaction management with USD conversion
- **Balance Display**: Real-time ETH balance with USD equivalent
- **Buy ETH**: Direct links to major exchanges (Coinbase, Kraken, Binance, Uniswap)
- **Token Swap**: Integration with DEXes (Uniswap, SushiSwap, Curve, 1inch)
- **Merchant Finder**: Locate crypto-accepting businesses (CoinMap)
- **ATM Locator**: Find cryptocurrency ATMs (CoinATMRadar)
- **Purple Theme**: Beautiful gradient UI with black ETH icon
- **Mobile Responsive**: Works on desktop and mobile devices

### 🔧 Wallet Generator Tools
- **Development Mode** (`eth-wallet-generator.js`): Full output for testing
- **Production Mode** (`eth-wallet-production.js`): Secure wallet generation
- **Standards Compliant**: BIP32/BIP39/BIP44 implementation
- **Cryptographic Security**: secp256k1, ECDSA, Keccak-256

## 🚀 Quick Start

### Web Interface

1. **Open the HTML file**:
   ```bash
   # Simply open in your browser
   open ethereum-wallet.html
   # or
   firefox ethereum-wallet.html
   ```

2. **Create or Import Wallet**:
   - Click "Create Wallet" to generate new wallet
   - Or "Import Wallet" to use existing credentials

3. **Start Using**:
   - View your balance
   - Send and receive ETH
   - Access buy/sell/swap features

### Command Line Wallet Generator

#### Prerequisites
```bash
npm install ethers@5.7.2
```

#### Development Mode (Testing)
```bash
node eth-wallet-generator.js
```
- Outputs complete wallet details including seed phrase
- **USE ONLY FOR TESTING**
- Never use with real funds

#### Production Mode (Real Use)
```bash
node eth-wallet-production.js
```
- Displays seed phrase ONCE for you to write down
- Secure generation for real wallets
- **USE FOR ACTUAL WALLETS**

## 📁 Project Structure

```
ethereum-wallet/
├── ethereum-wallet.html          # Web-based wallet interface
├── eth-wallet-generator.js       # Development wallet generator
├── eth-wallet-production.js      # Production wallet generator
├── eth-wallet-output.json        # Example output (development)
├── WALLET_DOCUMENTATION.md       # Comprehensive documentation
└── README.md                     # This file
```

## 🔐 Security Features

### Cryptographic Standards
- **Curve**: secp256k1 (Ethereum standard)
- **Algorithm**: ECDSA (Elliptic Curve Digital Signature Algorithm)
- **Hash Function**: Keccak-256
- **Key Derivation**: BIP32/BIP39/BIP44
- **Derivation Path**: `m/44'/60'/0'/0/0` (BIP44 standard)
- **Entropy**: 128 bits (12-word seed phrase)

### Best Practices Implemented
✅ Cryptographically secure random generation  
✅ BIP39 mnemonic seed phrases  
✅ Standard derivation paths  
✅ Client-side only (no server communication)  
✅ No data collection or tracking  
✅ Open source and auditable  

## ⚠️ Security Warnings

### 🔴 CRITICAL - Read Before Use

1. **NEVER share your seed phrase or private key with anyone**
2. **Write seed phrase on paper - NEVER digital**
3. **Loss of seed phrase = permanent loss of ALL funds**
4. **No one can recover lost seed phrases**
5. **Always verify addresses before sending large amounts**
6. **Test with small amounts first**
7. **Use hardware wallet for amounts over $10,000**

### 🚩 Scam Red Flags
- Anyone asking for your seed phrase is a scammer
- "Support" requesting private keys
- Urgent wallet verification messages
- Free NFT/token offers requiring credentials
- Emails claiming account suspension

## 📖 Usage Guide

### Creating a New Wallet

#### Web Interface
1. Open `ethereum-wallet.html` in browser
2. Click "Create Wallet"
3. **IMMEDIATELY write down the 12-word seed phrase**
4. Store seed phrase securely (see Security Instructions)
5. Click confirm to access wallet

#### Command Line
```bash
node eth-wallet-production.js
```
Follow the prompts to securely generate and backup your wallet.

### Importing Existing Wallet

#### Web Interface
1. Click "Import Wallet"
2. Enter your seed phrase or private key
3. Click "Import"

#### Command Line
```javascript
const ethers = require('ethers');
const wallet = ethers.Wallet.fromMnemonic('your twelve word seed phrase');
console.log('Address:', wallet.address);
```

### Sending ETH

1. Click "Send" button
2. Enter recipient address (or paste)
3. Enter amount in ETH or USD
4. Confirm transaction
5. Wait for blockchain confirmation

### Receiving ETH

1. Click "Receive" button
2. Copy your address
3. Share with sender
4. Monitor transaction on Etherscan

## 🔗 Network Configuration

### Ethereum Mainnet
- **RPC**: `https://cloudflare-eth.com`
- **Chain ID**: 1
- **Explorer**: https://etherscan.io

### Sepolia Testnet
- **RPC**: `https://rpc.sepolia.org`
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

### Layer 2 Options
- **Arbitrum**: Lower fees, faster
- **Optimism**: Ethereum-equivalent
- **Polygon**: High throughput
- **Base**: Coinbase L2

## 💻 Development

### Requirements
- Node.js 14+ (for CLI tools)
- Modern web browser (for HTML interface)
- ethers.js v5.7+

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/ethereum-wallet.git
cd ethereum-wallet

# Install dependencies
npm install ethers@5.7.2

# Run development generator
node eth-wallet-generator.js

# Run production generator
node eth-wallet-production.js
```

### Testing
```bash
# Generate test wallet
node eth-wallet-generator.js > test-wallet.json

# View output
cat test-wallet.json | jq
```

### Customization

#### Change Derivation Path
```javascript
// In eth-wallet-generator.js or eth-wallet-production.js
const config = {
    derivation_path: "m/44'/60'/0'/0/0", // Change this
    // ... other config
};
```

#### Adjust Security Level
```javascript
const config = {
    security_level: 'advanced', // basic | standard | advanced
    // ... other config
};
```

## 🛠️ API Reference

### Wallet Generation
```javascript
const ethers = require('ethers');

// Create random wallet
const wallet = ethers.Wallet.createRandom();

// From mnemonic
const wallet2 = ethers.Wallet.fromMnemonic('seed phrase');

// From private key
const wallet3 = new ethers.Wallet('0x...');
```

### Transaction Signing
```javascript
// Sign message
const signature = await wallet.signMessage("Hello");

// Sign transaction
const tx = {
    to: '0x...',
    value: ethers.utils.parseEther('0.1')
};
const signedTx = await wallet.signTransaction(tx);
```

### Balance Checking
```javascript
const provider = new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com');
const balance = await provider.getBalance(wallet.address);
console.log(ethers.utils.formatEther(balance), 'ETH');
```

## 🔒 Backup Instructions

### Step 1: Write Down Seed Phrase
- Use pen and paper (NEVER digital)
- Write clearly and legibly
- Verify each word spelling
- Number the words (1-12)

### Step 2: Secure Storage
- Fireproof/waterproof container
- Metal backup plates (Cryptosteel, Billfodl)
- Multiple secure locations
- Bank safety deposit box (optional)

### Step 3: Test Recovery
- Practice on testnet first
- Verify you can restore wallet
- Do BEFORE depositing large amounts

### Step 4: Never Do
- ❌ Screenshot or photograph
- ❌ Store in cloud/email
- ❌ Share with anyone
- ❌ Type in password manager
- ❌ Print on network printer

## 🌐 Integration Examples

### DeFi Integration
```javascript
// Connect to Uniswap
const uniswapRouter = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
// Use wallet to interact with DeFi protocols
```

### ENS Integration
```javascript
// Register ENS name
const provider = new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com');
const walletWithProvider = wallet.connect(provider);
// Register yourname.eth
```

### NFT Integration
```javascript
// Interact with NFT contracts
const nftContract = new ethers.Contract(address, abi, wallet);
await nftContract.mint();
```

## 📊 Features Comparison

| Feature | Web Interface | CLI Generator |
|---------|--------------|---------------|
| Create Wallet | ✅ | ✅ |
| Import Wallet | ✅ | ✅ |
| Send/Receive | ✅ | ⚠️ Code Required |
| Balance Display | ✅ | ⚠️ Code Required |
| Buy/Sell Links | ✅ | ❌ |
| Merchant Finder | ✅ | ❌ |
| ATM Locator | ✅ | ❌ |
| Offline Use | ✅ | ✅ |
| Production Ready | ✅ | ✅ |

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

### Code Style
- Use ES6+ features
- Follow security best practices
- Comment complex logic
- Update documentation

## 📄 License

MIT License - see LICENSE file for details

## ⚡ Roadmap

- [ ] Hardware wallet integration (Ledger/Trezor)
- [ ] Multi-signature support
- [ ] Token (ERC-20) management
- [ ] NFT (ERC-721/1155) display
- [ ] Transaction history
- [ ] Gas optimization
- [ ] Mobile app version
- [ ] QR code generation/scanning
- [ ] Address book
- [ ] Biometric authentication

## 📞 Support

- **Documentation**: See [WALLET_DOCUMENTATION.md](WALLET_DOCUMENTATION.md)
- **Issues**: GitHub Issues
- **Security**: Report vulnerabilities privately
- **Community**: Ethereum Stack Exchange

## 🙏 Acknowledgments

- Built with [ethers.js](https://docs.ethers.org)
- Following [Ethereum.org](https://ethereum.org) standards
- BIP39/BIP44 specifications
- Ethereum Foundation guidelines

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Users are responsible for:
- Securing their seed phrases
- Verifying all transactions
- Understanding cryptocurrency risks
- Following local regulations

**Always verify code before use. Never trust, always verify.**

---

## 🔥 Quick Links

- 🌐 [Ethereum.org](https://ethereum.org)
- 📚 [Ethers.js Docs](https://docs.ethers.org)
- 🔍 [Etherscan](https://etherscan.io)
- 💬 [Ethereum Stack Exchange](https://ethereum.stackexchange.com)
- 🛡️ [MetaMask Security](https://metamask.io/security/)

---

**Made with 💜 for the Ethereum community**

*Your keys, your crypto. Be your own bank.* 🏦
