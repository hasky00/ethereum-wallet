const assert = require('assert');
const ethers = require('ethers');
const { generateEthereumWallet, defaultConfig } = require('../eth-wallet-generator');
const { generateEthereumWallet: generateProdWallet, productionConfig } = require('../eth-wallet-production');

function testProductionOmitsSensitiveData() {
    const result = generateEthereumWallet({
        ...defaultConfig,
        environment: 'production',
        include_seed_phrase: 'no'
    });

    assert.ok(result.production_notice, 'Production notice should be present');
    assert.strictEqual(result.sensitive_data, undefined, 'Sensitive data must not be returned in production mode');
}

function testDevelopmentIncludesSensitiveData() {
    const result = generateEthereumWallet({
        ...defaultConfig,
        environment: 'development',
        include_seed_phrase: 'yes'
    });

    assert.ok(result.sensitive_data, 'Sensitive data should be present in development mode');
    assert.ok(result.sensitive_data.seed_phrase.split(' ').length >= 12, 'Seed phrase should have at least 12 words');
}

function testCustomDerivationPathRecorded() {
    const derivation_path = "m/44'/60'/0'/1/0";
    const mnemonic = 'test test test test test test test test test test test junk';
    const result = generateEthereumWallet({
        ...defaultConfig,
        derivation_path,
        mnemonic
    });

    assert.strictEqual(result.cryptographic_details.derivation_path, derivation_path, 'Custom derivation path should be recorded');
    const expectedAddress = ethers.Wallet.fromMnemonic(mnemonic, derivation_path).address;
    assert.strictEqual(result.public_identifiers.address, expectedAddress, 'Derived address should match derivation path output');
}

function testProductionScriptDoesNotLeakMnemonic() {
    const logs = [];
    const silentLogger = { log: (msg) => logs.push(String(msg)) };

    const result = generateProdWallet({
        ...productionConfig,
        include_seed_phrase: 'no'
    }, silentLogger);

    const combinedLogs = logs.join(' ').toLowerCase();
    assert.ok(!combinedLogs.includes('seed phrase (write on paper, never digital)'.toLowerCase()), 'Seed phrase prompt must not appear when include_seed_phrase is no');
    assert.strictEqual(result.production_notice.seed_phrase_displayed, false, 'Production notice should record mnemonic withholding');
}

function runTests() {
    testProductionOmitsSensitiveData();
    testDevelopmentIncludesSensitiveData();
    testCustomDerivationPathRecorded();
    testProductionScriptDoesNotLeakMnemonic();
    console.log('All wallet generator tests passed');
}

try {
    runTests();
} catch (error) {
    console.error('Test failed:', error.message);
    process.exitCode = 1;
}
