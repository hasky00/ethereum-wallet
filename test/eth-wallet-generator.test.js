const assert = require('assert');
const { generateEthereumWallet, defaultConfig } = require('../eth-wallet-generator');

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
    const result = generateEthereumWallet({
        ...defaultConfig,
        derivation_path
    });

    assert.strictEqual(result.cryptographic_details.derivation_path, derivation_path, 'Custom derivation path should be recorded');
}

function runTests() {
    testProductionOmitsSensitiveData();
    testDevelopmentIncludesSensitiveData();
    testCustomDerivationPathRecorded();
    console.log('All wallet generator tests passed');
}

try {
    runTests();
} catch (error) {
    console.error('Test failed:', error.message);
    process.exitCode = 1;
}
