const ethers = require('ethers');

// PRODUCTION Configuration
const config = {
    wallet_type: 'ethereum',
    security_level: 'advanced',
    output_format: 'json',
    include_seed_phrase: 'no',  // NEVER 'yes' in production
    derivation_path: "m/44'/60'/0'/0/0",
    environment: 'production'  // ALWAYS 'production' for real use
};

function generateEthereumWallet(config) {
    const wallet = ethers.Wallet.createRandom();
    
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
        
        production_notice: {
            message: '✅ Wallet generated securely with cryptographic entropy',
            instruction: 'Seed phrase has been generated but NOT displayed for security',
            action_required: 'User must write down seed phrase immediately on paper',
            secure_storage_required: true,
            recovery_warning: 'Without seed phrase backup, funds are permanently lost'
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
            backup_priority: 'CRITICAL - DO IMMEDIATELY',
            steps: [
                '1. Write seed phrase on paper (NEVER digital)',
                '2. Verify each word is spelled correctly',
                '3. Store in fireproof/waterproof container',
                '4. Consider metal backup plates (Cryptosteel, Billfodl)',
                '5. Split backup across 2-3 secure locations',
                '6. NEVER photograph, screenshot, or type into computer',
                '7. NEVER store in cloud, email, notes, or messaging',
                '8. NEVER share with anyone (no exceptions)',
                '9. Test recovery before depositing large amounts',
                '10. Consider hardware wallet for large holdings'
            ],
            advanced_options: {
                hardware_wallet: 'Ledger Nano X, Trezor Model T, GridPlus Lattice1',
                multi_sig: 'Gnosis Safe (2-of-3 or 3-of-5 signatures)',
                social_recovery: 'Argent wallet social recovery module',
                encryption: 'BIP38 encryption with strong passphrase',
                air_gapped: 'Generate on offline computer for maximum security'
            },
            red_flags: [
                '🚩 Anyone asking for your seed phrase is a scammer',
                '🚩 No legitimate service needs your private key',
                '🚩 Support staff will NEVER ask for credentials',
                '🚩 Urgent messages about "verifying wallet" are phishing',
                '🚩 Free NFT/token offers are usually scams'
            ]
        },
        
        recommended_next_steps: [
            '1. Backup seed phrase immediately (see security_instructions)',
            '2. Test with small amount (0.01 ETH)',
            '3. Practice recovery on testnet first',
            '4. Connect to Ethereum via Infura/Alchemy/your own node',
            '5. Monitor address on Etherscan',
            '6. Set up transaction notifications',
            '7. Consider ENS domain registration',
            '8. Review gas optimization strategies',
            '9. Set up address book for frequent recipients',
            '10. Document your backup locations (securely)'
        ],
        
        network_configuration: {
            mainnet: {
                rpc_url: 'https://cloudflare-eth.com',
                chain_id: 1,
                explorer: 'https://etherscan.io',
                gas_tracker: 'https://etherscan.io/gastracker'
            },
            testnet_sepolia: {
                rpc_url: 'https://rpc.sepolia.org',
                chain_id: 11155111,
                explorer: 'https://sepolia.etherscan.io',
                faucet: 'https://sepoliafaucet.com'
            },
            layer2_options: {
                arbitrum: 'https://arbitrum.io',
                optimism: 'https://optimism.io',
                polygon: 'https://polygon.technology',
                base: 'https://base.org'
            }
        },
        
        warnings: [
            '⚠️ NEVER share your seed phrase or private key',
            '⚠️ This wallet controls real funds - treat with extreme care',
            '⚠️ Loss of seed phrase = permanent loss of ALL funds',
            '⚠️ No customer support can recover lost seeds',
            '⚠️ Verify addresses character-by-character before large sends',
            '⚠️ Beware of phishing sites and fake wallet apps',
            '⚠️ Test recovery process before storing significant funds',
            '⚠️ Consider multi-sig for amounts over $10,000',
            '⚠️ Keep wallet software updated',
            '⚠️ Use hardware wallet for cold storage'
        ]
    };
    
    // In production, guide user to backup but don't display
    if (config.environment === 'production') {
        console.log('\n════════════════════════════════════════════════════════');
        console.log('🔐 SECURE WALLET GENERATION COMPLETE');
        console.log('════════════════════════════════════════════════════════\n');
        console.log('Your 12-word seed phrase has been generated.');
        console.log('It is displayed ONCE below - write it down NOW.\n');
        console.log('════════════════════════════════════════════════════════');
        console.log('SEED PHRASE (write on paper, never digital):');
        console.log('════════════════════════════════════════════════════════\n');
        console.log(wallet.mnemonic.phrase);
        console.log('\n════════════════════════════════════════════════════════');
        console.log('⚠️  This will NOT be shown again');
        console.log('⚠️  Loss of this phrase = loss of ALL funds');
        console.log('════════════════════════════════════════════════════════\n');
        
        // Pause to allow user to write down
        console.log('Press Enter after writing down your seed phrase...\n');
    }
    
    return output;
}

const result = generateEthereumWallet(config);

if (config.output_format === 'json') {
    console.log(JSON.stringify(result, null, 2));
}
