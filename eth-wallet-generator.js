const ethers = require('ethers');

// Configuration
const config = {
    wallet_type: 'ethereum',
    security_level: 'advanced',
    output_format: 'json',
    include_seed_phrase: 'yes',
    derivation_path: "m/44'/60'/0'/0/0", // BIP44 Ethereum standard
    environment: 'development'
};

// Generate Ethereum Wallet
function generateEthereumWallet(config) {
    // Generate random wallet with cryptographically secure entropy
    const wallet = ethers.Wallet.createRandom();
    
    // Derive wallet at specific path if custom path provided
    let derivedWallet = wallet;
    if (config.derivation_path && config.derivation_path !== "m/44'/60'/0'/0/0") {
        const hdNode = ethers.utils.HDNode.fromMnemonic(wallet.mnemonic.phrase);
        derivedWallet = hdNode.derivePath(config.derivation_path);
    }
    
    const output = {
        wallet_type: config.wallet_type,
        security_level: config.security_level,
        environment: config.environment,
        timestamp: new Date().toISOString(),
        
        cryptographic_details: {
            curve: 'secp256k1',
            algorithm: 'ECDSA',
            hash_function: 'Keccak-256',
            key_derivation: 'BIP32/BIP39/BIP44',
            derivation_path: config.derivation_path,
            entropy_bits: 128
        },
        
        public_identifiers: {
            address: wallet.address,
            public_key: wallet.publicKey,
            checksum_address: ethers.utils.getAddress(wallet.address)
        },
        
        implementation_example: {
            initialization: {
                language: 'JavaScript',
                library: 'ethers.js v5+',
                code: `const ethers = require('ethers');\nconst wallet = ethers.Wallet.fromMnemonic('YOUR_SEED_PHRASE');\nconsole.log(wallet.address);`
            },
            signing_message: {
                description: 'Sign arbitrary message',
                code: `const message = "Hello Ethereum";\nconst signature = await wallet.signMessage(message);\nconsole.log(signature);`
            },
            signing_transaction: {
                description: 'Sign and send transaction',
                code: `const tx = {\n  to: '0x...',\n  value: ethers.utils.parseEther('0.1'),\n  gasLimit: 21000\n};\nconst signedTx = await wallet.signTransaction(tx);\nconst receipt = await wallet.sendTransaction(tx);`
            }
        },
        
        security_instructions: {
            backup_priority: 'CRITICAL',
            steps: [
                '1. Write seed phrase on paper (never digital)',
                '2. Store in fireproof/waterproof container',
                '3. Consider splitting across multiple secure locations',
                '4. Use metal backup plates for extreme durability',
                '5. Never photograph or screenshot seed phrase',
                '6. Never store in cloud, email, or messaging apps',
                '7. Never share with anyone under any circumstances'
            ],
            advanced_options: {
                hardware_wallet: 'Ledger Nano X, Trezor Model T',
                multi_sig: 'Gnosis Safe for shared custody',
                social_recovery: 'Argent wallet social recovery',
                encryption: 'Encrypt private key with strong passphrase (BIP38)'
            }
        },
        
        recommended_next_steps: [
            'Test wallet with small amount first',
            'Connect to Ethereum mainnet via Infura/Alchemy',
            'Set up Web3 provider connection',
            'Monitor address on Etherscan',
            'Consider ENS domain registration',
            'Set up transaction monitoring/alerts',
            'Review gas optimization strategies',
            'Implement transaction retry logic',
            'Set up backup wallet for recovery testing'
        ],
        
        network_configuration: {
            mainnet: {
                rpc_url: 'https://cloudflare-eth.com',
                chain_id: 1,
                explorer: 'https://etherscan.io'
            },
            testnet_sepolia: {
                rpc_url: 'https://rpc.sepolia.org',
                chain_id: 11155111,
                explorer: 'https://sepolia.etherscan.io',
                faucet: 'https://sepoliafaucet.com'
            }
        },
        
        warnings: [
            '⚠️ NEVER share your seed phrase or private key',
            '⚠️ This wallet controls real funds - treat with extreme care',
            '⚠️ Loss of seed phrase = permanent loss of funds',
            '⚠️ No customer support can recover lost seeds',
            '⚠️ Verify addresses before sending large amounts',
            '⚠️ Beware of phishing sites and fake wallets',
            '⚠️ Test recovery process before storing significant funds',
            '⚠️ This is development mode - secrets are exposed'
        ]
    };
    
    // Include sensitive data only in development mode
    if (config.environment === 'development' && config.include_seed_phrase === 'yes') {
        output.sensitive_data = {
            seed_phrase: wallet.mnemonic.phrase,
            private_key: wallet.privateKey,
            mnemonic_locale: wallet.mnemonic.locale,
            word_count: wallet.mnemonic.phrase.split(' ').length,
            WARNING: 'NEVER EXPOSE THESE VALUES IN PRODUCTION'
        };
    } else if (config.environment === 'production') {
        output.production_notice = {
            message: 'Seed phrase generation performed but not displayed',
            instruction: 'Private keys generated locally and should be stored offline immediately',
            secure_storage_required: true
        };
    }
    
    return output;
}

// Generate and output
const result = generateEthereumWallet(config);

if (config.output_format === 'json') {
    console.log(JSON.stringify(result, null, 2));
}

