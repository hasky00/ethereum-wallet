const MARKET_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether&vs_currencies=usd,btc&include_24hr_change=true&precision=8';
const MARKET_REFRESH_MS = 60000;
const NETWORKS = {
    mainnet: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrls: [
            'https://cloudflare-eth.com',
            'https://rpc.ankr.com/eth',
            'https://ethereum.publicnode.com'
        ]
    },
    sepolia: {
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrls: [
            'https://rpc.sepolia.org',
            'https://rpc.ankr.com/eth_sepolia',
            'https://ethereum-sepolia.publicnode.com'
        ]
    }
};

let activeNetwork = 'mainnet';
let ethPriceUSD = 2450.00;
let wallet = null;
let provider = null;
let marketIntervalId = null;
let pendingWallet = null;
let pendingMnemonic = null;
let nostrIdentity = null;
let activeFeedTab = 'following';
const followedAuthors = new Set(['hasky.eth']);
const communityPosts = [
    {
        author: 'hasky.eth',
        tag: 'Builders',
        body: 'Nostr identity for entry. Fresh ETH wallet for funds. That separation is the pattern.',
        likes: 51,
        comments: 12,
        followed: true,
        address: 'npub1...hasky'
    },
    {
        author: 'maya.nostr',
        tag: 'Market',
        body: 'ETH gas is calm today. Good window for small transfers and testing wallet flows.',
        likes: 24,
        comments: 6,
        followed: false,
        address: '0x91...2B0'
    },
    {
        author: 'nova',
        tag: 'Builders',
        body: 'Anyone using Sepolia for onboarding tests? Drop faucet notes and UX tips below.',
        likes: 8,
        comments: 3,
        followed: false,
        address: 'npub1...nova'
    }
];
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function normalizeMnemonic(input) {
    return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function bech32Polymod(values) {
    const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const value of values) {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        for (let i = 0; i < 5; i += 1) {
            if ((top >> i) & 1) {
                chk ^= generators[i];
            }
        }
    }
    return chk;
}

function bech32HrpExpand(hrp) {
    const result = [];
    for (let i = 0; i < hrp.length; i += 1) result.push(hrp.charCodeAt(i) >> 5);
    result.push(0);
    for (let i = 0; i < hrp.length; i += 1) result.push(hrp.charCodeAt(i) & 31);
    return result;
}

function bech32CreateChecksum(hrp, words) {
    const values = bech32HrpExpand(hrp).concat(words);
    const polymod = bech32Polymod(values.concat([0, 0, 0, 0, 0, 0])) ^ 1;
    const checksum = [];
    for (let i = 0; i < 6; i += 1) {
        checksum.push((polymod >> (5 * (5 - i))) & 31);
    }
    return checksum;
}

function encodeBech32(hrp, bytes) {
    const words = convertBits(bytes, 8, 5, true);
    const combined = words.concat(bech32CreateChecksum(hrp, words));
    return hrp + '1' + combined.map((word) => BECH32_CHARSET[word]).join('');
}

function decodeBech32(value) {
    const input = value.trim();
    if (input !== input.toLowerCase() && input !== input.toUpperCase()) {
        throw new Error('Mixed-case Nostr key');
    }
    const normalized = input.toLowerCase();
    const separator = normalized.lastIndexOf('1');
    if (separator < 1 || separator + 7 > normalized.length) {
        throw new Error('Invalid Nostr key format');
    }

    const hrp = normalized.slice(0, separator);
    const data = [];
    for (const char of normalized.slice(separator + 1)) {
        const index = BECH32_CHARSET.indexOf(char);
        if (index === -1) throw new Error('Invalid Nostr key character');
        data.push(index);
    }

    const checksum = bech32Polymod(bech32HrpExpand(hrp).concat(data));
    if (checksum !== 1) throw new Error('Invalid Nostr key checksum');
    return { hrp, words: data.slice(0, -6) };
}

function convertBits(data, fromBits, toBits, pad) {
    let acc = 0;
    let bits = 0;
    const result = [];
    const maxv = (1 << toBits) - 1;
    const maxAcc = (1 << (fromBits + toBits - 1)) - 1;

    for (const value of data) {
        if (value < 0 || (value >> fromBits) !== 0) throw new Error('Invalid Nostr key data');
        acc = ((acc << fromBits) | value) & maxAcc;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            result.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
        throw new Error('Invalid Nostr key padding');
    }

    return result;
}

function decodeNostrKey(value) {
    const decoded = decodeBech32(value);
    if (decoded.hrp !== 'npub' && decoded.hrp !== 'nsec') {
        throw new Error('Use an npub or nsec key');
    }
    const bytes = convertBits(decoded.words, 5, 8, false);
    if (bytes.length !== 32) throw new Error('Nostr key must decode to 32 bytes');
    return { type: decoded.hrp, bytes, value: value.trim() };
}

function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
    const clean = hex.replace(/^0x/, '');
    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
        bytes.push(parseInt(clean.slice(i, i + 2), 16));
    }
    return bytes;
}

function deriveNpubFromNsecBytes(bytes) {
    const privateKey = '0x' + bytesToHex(bytes);
    const publicKey = ethers.utils.computePublicKey(privateKey, false);
    const xOnlyPublicKey = publicKey.slice(4, 68);
    return encodeBech32('npub', hexToBytes(xOnlyPublicKey));
}

function getNostrIdentity(nostrKey) {
    if (nostrKey.type === 'npub') {
        return {
            type: 'npub',
            value: nostrKey.value
        };
    }

    return {
        type: 'npub',
        value: deriveNpubFromNsecBytes(nostrKey.bytes)
    };
}

function shortKey(value) {
    if (!value || value.length <= 24) return value || '';
    return `${value.slice(0, 14)}...${value.slice(-8)}`;
}

async function initProvider() {
    try {
        const network = NETWORKS[activeNetwork];
        const providers = network.rpcUrls.map((url, index) => ({
            provider: new ethers.providers.StaticJsonRpcProvider(url, network.chainId),
            weight: 1,
            priority: index + 1
        }));
        provider = new ethers.providers.FallbackProvider(providers, 1);
        return provider;
    } catch (error) {
        console.error('Provider initialization failed:', error);
        return null;
    }
}

async function applyNetworkSelection() {
    const select = document.getElementById('networkSelect');
    if (select && select.value) {
        activeNetwork = select.value;
    }
    updateNetworkBadge();
    await initProvider();
    if (wallet && provider) {
        wallet = wallet.connect(provider);
        await updateBalance();
    }
}

function updateNetworkBadge() {
    const badge = document.getElementById('networkBadge');
    if (!badge) return;
    const network = NETWORKS[activeNetwork];
    badge.textContent = network ? network.name : 'Unknown Network';
}

function getCachedPrice() {
    const cached = Number(localStorage.getItem('ethPriceUSD'));
    return Number.isFinite(cached) && cached > 0 ? cached : null;
}

function formatUsd(value) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUsdt(value) {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

function formatBtc(value) {
    return `${value.toFixed(8)} BTC`;
}

async function fetchMarketData() {
    try {
        const response = await fetch(MARKET_API_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        const market = payload?.ethereum;
        const tether = payload?.tether;

        if (!market || typeof market.usd !== 'number') {
            throw new Error('Malformed market data');
        }

        const price = market.usd;
        const btcPrice = typeof market.btc === 'number' ? market.btc : null;
        const usdtPrice = tether && typeof tether.usd === 'number' && tether.usd > 0
            ? price / tether.usd
            : price;
        const change = typeof market.usd_24h_change === 'number' ? market.usd_24h_change : 0;

        ethPriceUSD = price;
        localStorage.setItem('ethPriceUSD', String(price));
        updateMarketUI({ price, btcPrice, usdtPrice, change, statusLabel: 'Live market data (CoinGecko)' });
    } catch (error) {
        console.error('Market data fetch failed:', error);
        const cachedPrice = getCachedPrice();
        if (cachedPrice) {
            ethPriceUSD = cachedPrice;
            updateMarketUI({ price: cachedPrice, btcPrice: null, usdtPrice: cachedPrice, change: 0, statusLabel: 'Live price unavailable (cached)' });
        } else {
            document.getElementById('marketStatus').textContent = 'Live price unavailable';
        }
    }
}

function updateMarketUI({ price, btcPrice, usdtPrice, change, statusLabel }) {
    const priceEl = document.getElementById('marketPrice');
    const ethUsdPairEl = document.getElementById('ethUsdPair');
    const ethBtcPairEl = document.getElementById('ethBtcPair');
    const ethUsdtPairEl = document.getElementById('ethUsdtPair');
    const changeEl = document.getElementById('marketChange');
    const statusEl = document.getElementById('marketStatus');
    const updatedAtEl = document.getElementById('marketUpdatedAt');

    if (!priceEl || !changeEl || !statusEl || !updatedAtEl) return;

    priceEl.textContent = `${formatUsd(price)} USD`;
    if (ethUsdPairEl) ethUsdPairEl.textContent = formatUsd(price);
    if (ethBtcPairEl) ethBtcPairEl.textContent = Number.isFinite(btcPrice) ? formatBtc(btcPrice) : '-- BTC';
    if (ethUsdtPairEl) ethUsdtPairEl.textContent = Number.isFinite(usdtPrice) ? formatUsdt(usdtPrice) : '-- USDT';
    const roundedChange = change.toFixed(2);
    changeEl.textContent = `${roundedChange}% 24h`;
    changeEl.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
    statusEl.textContent = statusLabel || 'Live market data (CoinGecko)';
    updatedAtEl.textContent = new Date().toLocaleTimeString();

    updateBalance();
}

function startMarketWatcher() {
    fetchMarketData();
    if (marketIntervalId) {
        clearInterval(marketIntervalId);
    }
    marketIntervalId = setInterval(fetchMarketData, MARKET_REFRESH_MS);
}

function getEffectivePrice() {
    return Number.isFinite(ethPriceUSD) && ethPriceUSD > 0 ? ethPriceUSD : 2450.0;
}

function openSafeExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

function showSeedModal(mnemonic) {
    document.getElementById('seedPhraseDisplay').textContent = mnemonic;
    document.getElementById('seedPhraseConfirm').value = '';
    document.getElementById('seedModal').classList.add('active');
}

function cancelSeedPhrase() {
    pendingWallet = null;
    pendingMnemonic = null;
    closeModal('seedModal');
    showToast('Wallet creation canceled');
}

async function confirmSeedPhrase() {
    if (!pendingWallet || !pendingMnemonic) {
        showToast('No wallet pending confirmation');
        return;
    }
    const confirmation = normalizeMnemonic(document.getElementById('seedPhraseConfirm').value || '');
    if (confirmation !== normalizeMnemonic(pendingMnemonic)) {
        showToast('Seed phrase does not match. Please try again.');
        return;
    }
    wallet = pendingWallet;
    pendingWallet = null;
    pendingMnemonic = null;
    closeModal('seedModal');
    await connectWallet();
    offerPin();
}

async function createNewWallet() {
    try {
        if (typeof ethers === 'undefined') {
            showToast('Error: Ethers.js library not loaded');
            return;
        }

        pendingWallet = ethers.Wallet.createRandom();
        pendingMnemonic = pendingWallet.mnemonic.phrase;
        nostrIdentity = null;
        showSeedModal(pendingMnemonic);
    } catch (error) {
        console.error('Wallet creation error:', error);
        showToast('Error creating wallet: ' + error.message);
    }
}

async function createWalletFromNostr() {
    const input = document.getElementById('nostrKeyInput').value.trim();

    try {
        if (typeof ethers === 'undefined') {
            showToast('Error: Ethers.js library not loaded');
            return;
        }
        if (!input) {
            showToast('Paste an npub or nsec key');
            return;
        }

        const nostrKey = decodeNostrKey(input);
        nostrIdentity = getNostrIdentity(nostrKey);
        pendingWallet = ethers.Wallet.createRandom();
        pendingMnemonic = pendingWallet.mnemonic.phrase;
        document.getElementById('nostrKeyInput').value = '';
        showSeedModal(pendingMnemonic);
        showToast('Fresh ETH wallet linked to Nostr');
    } catch (error) {
        console.error('Nostr wallet error:', error);
        showToast(error.message || 'Invalid Nostr key');
    }
}

function showImportModal() {
    document.getElementById('importModal').classList.add('active');
}

async function importWallet() {
    let input = document.getElementById('importKey').value.trim();
    
    try {
        if (typeof ethers === 'undefined') {
            showToast('Error: Ethers.js library not loaded');
            return;
        }

        if (input.includes(' ')) {
            const normalized = normalizeMnemonic(input);
            if (!ethers.utils.isValidMnemonic(normalized)) {
                showToast('Invalid seed phrase');
                return;
            }
            wallet = ethers.Wallet.fromMnemonic(normalized);
            nostrIdentity = null;
        } else if (input.toLowerCase().startsWith('nsec1')) {
            const nostrKey = decodeNostrKey(input);
            nostrIdentity = getNostrIdentity(nostrKey);
            pendingWallet = ethers.Wallet.createRandom();
            pendingMnemonic = pendingWallet.mnemonic.phrase;
            closeModal('importModal');
            document.getElementById('importKey').value = '';
            showSeedModal(pendingMnemonic);
            showToast('Fresh ETH wallet linked to Nostr');
            return;
        } else {
            if (!input.startsWith('0x')) {
                input = '0x' + input;
            }
            if (!ethers.utils.isHexString(input, 32)) {
                showToast('Invalid private key');
                return;
            }
            wallet = new ethers.Wallet(input);
            nostrIdentity = null;
        }
        
        closeModal('importModal');
        document.getElementById('importKey').value = '';
        showToast('Wallet imported successfully!');
        await connectWallet();
        offerPin();
    } catch (error) {
        console.error('Import error:', error);
        showToast('Invalid private key or seed phrase');
    }
}

async function connectWallet() {
    if (!wallet) return;
    
    await initProvider();
    if (provider) {
        wallet = wallet.connect(provider);
    }

    updateNetworkBadge();
    document.getElementById('createScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    document.getElementById('walletAddress').textContent = wallet.address;
    updateNostrIdentityCard();
    renderCommunityFeed();
    
    await updateBalance();
}

function updateNostrIdentityCard() {
    const card = document.getElementById('nostrIdentityCard');
    const value = document.getElementById('nostrIdentityValue');
    if (!card || !value) return;

    if (nostrIdentity) {
        value.textContent = `${nostrIdentity.type}: ${shortKey(nostrIdentity.value)}`;
        card.classList.remove('hidden');
    } else {
        value.textContent = '';
        card.classList.add('hidden');
    }
}

async function updateBalance() {
    if (!wallet || !provider) {
        document.getElementById('ethBalance').textContent = '0.0000';
        document.getElementById('usdBalance').textContent = '$0.00 USD';
        return;
    }

    try {
        const balance = await provider.getBalance(wallet.address);
        const ethBalance = parseFloat(ethers.utils.formatEther(balance));

        document.getElementById('ethBalance').textContent = ethBalance.toFixed(4);
        const price = getEffectivePrice();
        document.getElementById('usdBalance').textContent = '$' + (ethBalance * price).toFixed(2) + ' USD';
    } catch (error) {
        console.error('Balance update failed:', error);
        document.getElementById('ethBalance').textContent = '0.0000';
        document.getElementById('usdBalance').textContent = '$0.00 USD';
    }
}

// ---- Saved wallet on this device (ethers keystore, encrypted with a PIN) ----
const KEYSTORE_KEY = 'ethWalletKeystore';
const NOSTR_ID_KEY = 'ethWalletNostrIdentity';

function hasSavedWallet() {
    try { return !!localStorage.getItem(KEYSTORE_KEY); } catch (e) { return false; }
}

function showLandingPanels() {
    const saved = hasSavedWallet();
    document.getElementById('unlockPanel').classList.toggle('hidden', !saved);
    document.getElementById('createPanel').classList.toggle('hidden', saved);
}

function offerPin() {
    if (!wallet || hasSavedWallet()) return;
    document.getElementById('pinSet').value = '';
    document.getElementById('pinRepeat').value = '';
    document.getElementById('pinModal').classList.add('active');
}

function skipPin() {
    closeModal('pinModal');
}

async function savePin() {
    const pin = document.getElementById('pinSet').value;
    const repeat = document.getElementById('pinRepeat').value;
    if (pin.length < 6) { showToast('PIN must be at least 6 characters'); return; }
    if (pin !== repeat) { showToast('PINs do not match'); return; }
    if (!wallet) { showToast('No wallet to save'); return; }
    try {
        showToast('Encrypting...');
        // scrypt N lowered so phones encrypt in a second or two; still far stronger than plain storage.
        const json = await wallet.encrypt(pin, { scrypt: { N: 1 << 13 } });
        localStorage.setItem(KEYSTORE_KEY, json);
        if (nostrIdentity) localStorage.setItem(NOSTR_ID_KEY, JSON.stringify(nostrIdentity));
        else localStorage.removeItem(NOSTR_ID_KEY);
        closeModal('pinModal');
        showToast('Wallet saved on this device');
    } catch (err) {
        showToast('Could not save: ' + err.message);
    }
}

async function unlockWallet() {
    const pin = document.getElementById('unlockPin').value;
    if (!pin) { showToast('Enter your PIN'); return; }
    const json = localStorage.getItem(KEYSTORE_KEY);
    if (!json) { showLandingPanels(); return; }
    try {
        showToast('Unlocking...');
        wallet = await ethers.Wallet.fromEncryptedJson(json, pin);
        const n = localStorage.getItem(NOSTR_ID_KEY);
        nostrIdentity = n ? JSON.parse(n) : null;
        document.getElementById('unlockPin').value = '';
        await connectWallet();
    } catch (err) {
        showToast('Wrong PIN');
    }
}

function forgetWallet() {
    if (!window.confirm('Remove the saved wallet from this device? You can always import it again with your seed phrase.')) return;
    localStorage.removeItem(KEYSTORE_KEY);
    localStorage.removeItem(NOSTR_ID_KEY);
    wallet = null;
    nostrIdentity = null;
    showLandingPanels();
    showToast('Wallet removed from this device');
}

function logout() {
    wallet = null;
    provider = null;
    nostrIdentity = null;
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.getElementById('createScreen').classList.remove('hidden');
    showLayer('wallet');
    updateNostrIdentityCard();
    showLandingPanels();
    showToast(hasSavedWallet() ? 'Wallet locked' : 'Wallet disconnected');
}

function showLayer(layer) {
    const walletLayer = document.getElementById('walletLayer');
    const communityLayer = document.getElementById('communityLayer');

    if (!walletLayer || !communityLayer) return;

    const showingCommunity = layer === 'community';
    walletLayer.classList.toggle('hidden', showingCommunity);
    communityLayer.classList.toggle('hidden', !showingCommunity);

    if (showingCommunity) {
        renderCommunityFeed();
    }
}

function getCommunityAuthor() {
    if (nostrIdentity && nostrIdentity.value) {
        return shortKey(nostrIdentity.value);
    }
    if (wallet && wallet.address) {
        return shortKey(wallet.address);
    }
    return 'guest';
}

function getCommunityAddressLabel(showAddress) {
    if (showAddress && wallet && wallet.address) {
        return shortKey(wallet.address);
    }
    if (nostrIdentity && nostrIdentity.value) {
        return shortKey(nostrIdentity.value);
    }
    return 'private wallet';
}

function publishCommunityPost() {
    const input = document.getElementById('communityPostInput');
    const showAddress = document.getElementById('showEthAddressToggle')?.checked;
    const body = (input?.value || '').trim();

    if (!body) {
        showToast('Write something first');
        return;
    }

    communityPosts.unshift({
        author: getCommunityAuthor(),
        tag: activeFeedTab === 'builders' ? 'Builders' : 'Market',
        body,
        likes: 0,
        comments: 0,
        followed: true,
        address: getCommunityAddressLabel(showAddress)
    });

    if (input) input.value = '';
    renderCommunityFeed();
    showToast('Posted to community');
}

function setFeedTab(event, tab) {
    activeFeedTab = tab;
    document.querySelectorAll('.feed-tab').forEach((button) => button.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    renderCommunityFeed();
}

function getVisiblePosts() {
    if (activeFeedTab === 'following') {
        return communityPosts.filter((post) => post.followed || followedAuthors.has(post.author));
    }
    if (activeFeedTab === 'market') {
        return communityPosts.filter((post) => post.tag === 'Market');
    }
    return communityPosts.filter((post) => post.tag === 'Builders');
}

function renderCommunityFeed() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;

    const posts = getVisiblePosts();
    if (!posts.length) {
        feed.innerHTML = '<div class="post-card"><div class="post-body">No posts here yet. Start the room.</div></div>';
        return;
    }

    feed.innerHTML = posts.map((post, index) => `
        <div class="post-card">
            <div class="post-head">
                <div>
                    <div class="post-author">${escapeHtml(post.author)}</div>
                    <div>${escapeHtml(post.address)} · ${escapeHtml(post.tag)}</div>
                </div>
                <div>${post.followed ? 'Following' : 'Follow'}</div>
            </div>
            <div class="post-body">${escapeHtml(post.body)}</div>
            <div class="post-actions">
                <button onclick="likeCommunityPost(${index})">Like ${post.likes}</button>
                <button onclick="commentCommunityPost(${index})">Comment ${post.comments}</button>
                <button onclick="toggleFollowCommunityPost(${index})">${post.followed ? 'Following' : 'Follow'}</button>
            </div>
        </div>
    `).join('');
}

function getPostByVisibleIndex(index) {
    return getVisiblePosts()[index];
}

function likeCommunityPost(index) {
    const post = getPostByVisibleIndex(index);
    if (!post) return;
    post.likes += 1;
    renderCommunityFeed();
}

function commentCommunityPost(index) {
    const post = getPostByVisibleIndex(index);
    if (!post) return;
    post.comments += 1;
    renderCommunityFeed();
    showToast('Comment added locally');
}

function toggleFollowCommunityPost(index) {
    const post = getPostByVisibleIndex(index);
    if (!post) return;
    post.followed = !post.followed;
    if (post.followed) followedAuthors.add(post.author);
    else followedAuthors.delete(post.author);
    renderCommunityFeed();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showReceiveModal() {
    if (wallet) {
        document.getElementById('receiveModal').classList.add('active');
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            try {
                new QRCode(qrContainer, {
                    text: wallet.address,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) {
                qrContainer.textContent = 'QR unavailable';
                console.error('QR generation failed', e);
            }
        }
    }
}

function showSendModal() {
    document.getElementById('sendModal').classList.add('active');
}

// MoonPay on-ramp. Add your publishable key (pk_live_... / pk_test_...) once you have one;
// leave empty and MoonPay still works, just without attribution to this app.
const MOONPAY_API_KEY = '';
const MOONPAY_BASE_URL = 'https://buy.moonpay.com/';

function showBuyModal() {
    if (!wallet || !wallet.address) {
        showToast('Create or import a wallet first');
        return;
    }
    document.getElementById('buyModal').classList.add('active');
}

async function buyWith(paymentMethod) {
    if (!wallet || !wallet.address) {
        showToast('Create or import a wallet first');
        return;
    }

    const params = new URLSearchParams({
        currencyCode: 'eth',
        paymentMethod: paymentMethod,
        walletAddress: wallet.address,
        theme: 'dark'
    });
    if (MOONPAY_API_KEY) {
        params.set('apiKey', MOONPAY_API_KEY);
    }

    // Copy the address too: MoonPay only pre-fills it from a signed link,
    // so the user may need to paste it in the checkout.
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(wallet.address);
        } else {
            fallbackCopyText(wallet.address);
        }
    } catch (err) {
        // clipboard is a nice-to-have
    }

    closeModal('buyModal');
    openSafeExternal(MOONPAY_BASE_URL + '?' + params.toString());
    showToast('Address copied. Paste it in MoonPay if asked.');
}

// THORChain BTC -> ETH top-up.
// THOR_AFFILIATE is your THORName (register one on-chain, then put it here).
// THOR_AFFILIATE_BPS is your cut in basis points: 50 = 0.5%. Paid by THORChain to the THORName owner.
// Public nodes, tried in order until one answers.
const THORNODE_URLS = [
    'https://gateway.liquify.com/chain/thorchain_api',
    'https://thornode.thorswap.net'
];
const MIDGARD_URLS = [
    'https://gateway.liquify.com/chain/thorchain_midgard',
    'https://midgard.thorswap.net'
];

// fetch JSON from the first host that responds; path starts with '/'
async function thorFetch(hosts, path) {
    let lastErr = null;
    for (const host of hosts) {
        try {
            const res = await fetch(host + path, { cache: 'no-store' });
            const data = await res.json();
            return { res, data, host };
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error('No THORChain node reachable');
}
const THOR_AFFILIATE = 'hasky';
const THOR_AFFILIATE_BPS = 50;
let btcQuote = null;
let btcPollTimer = null;

function showBtcTopupModal() {
    if (!wallet || !wallet.address) {
        showToast('Create or import a wallet first');
        return;
    }
    closeModal('buyModal');
    resetBtcTopup();
    document.getElementById('btcModal').classList.add('active');
    loadBtcMinHint();
}

function resetBtcTopup() {
    btcQuote = null;
    if (btcPollTimer) { clearInterval(btcPollTimer); btcPollTimer = null; }
    document.getElementById('btcStepAmount').style.display = 'block';
    document.getElementById('btcStepPay').style.display = 'none';
    document.getElementById('btc-qr').innerHTML = '';
}

// THORChain uses 1e8 base units for every asset.
function toE8(amountStr) {
    return BigInt(Math.round(parseFloat(amountStr) * 1e8));
}
function fromE8(e8Str, decimals = 6) {
    return (Number(BigInt(e8Str)) / 1e8).toFixed(decimals);
}

function thorQuotePath(amountE8) {
    const params = new URLSearchParams({
        from_asset: 'BTC.BTC',
        to_asset: 'ETH.ETH',
        amount: amountE8.toString(),
        destination: wallet.address
    });
    if (THOR_AFFILIATE) {
        params.set('affiliate', THOR_AFFILIATE);
        params.set('affiliate_bps', String(THOR_AFFILIATE_BPS));
    }
    return '/thorchain/quote/swap?' + params.toString();
}

async function loadBtcMinHint() {
    const hint = document.getElementById('btcMinHint');
    hint.textContent = 'Checking minimum amount...';
    try {
        const { data } = await thorFetch(THORNODE_URLS, thorQuotePath(1000000n)); // 0.01 BTC probe
        if (data.recommended_min_amount_in) {
            hint.textContent = 'Minimum recommended: ' + fromE8(data.recommended_min_amount_in, 5) + ' BTC. Below that, network fees eat most of the swap.';
        } else {
            hint.textContent = '';
        }
    } catch (err) {
        hint.textContent = 'Could not reach THORChain right now. Try again in a moment.';
    }
}

async function getBtcQuote() {
    const amountStr = document.getElementById('btcAmount').value;
    if (!amountStr || parseFloat(amountStr) <= 0) {
        showToast('Enter a BTC amount');
        return;
    }
    const btn = document.getElementById('btcQuoteBtn');
    btn.disabled = true;
    btn.textContent = 'Getting quote...';
    try {
        const { res, data } = await thorFetch(THORNODE_URLS, thorQuotePath(toE8(amountStr)));
        if (!res.ok || data.error) {
            throw new Error(data.error || 'Quote failed');
        }
        if (!data.inbound_address || !data.memo) {
            throw new Error('THORChain returned no deposit address');
        }
        btcQuote = data;
        showBtcPayStep(amountStr, data);
    } catch (err) {
        showToast('THORChain: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Get quote';
    }
}

function showBtcPayStep(amountStr, q) {
    document.getElementById('btcStepAmount').style.display = 'none';
    document.getElementById('btcStepPay').style.display = 'block';
    document.getElementById('btcExpectedOut').textContent = fromE8(q.expected_amount_out);
    document.getElementById('btcSendAmount').textContent = parseFloat(amountStr).toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    document.getElementById('btcInboundAddress').textContent = q.inbound_address;
    document.getElementById('btcMemo').textContent = q.memo;

    if (q.expiry) {
        const mins = Math.max(1, Math.round((q.expiry * 1000 - Date.now()) / 60000));
        document.getElementById('btcExpiry').textContent = mins + ' min';
    } else {
        document.getElementById('btcExpiry').textContent = 'a few minutes';
    }

    // BIP-21 URI so wallets that support it pre-fill the amount. Memo still has to be entered by hand in most wallets.
    const uri = 'bitcoin:' + q.inbound_address + '?amount=' + parseFloat(amountStr).toFixed(8);
    const qr = document.getElementById('btc-qr');
    qr.innerHTML = '';
    try {
        new QRCode(qr, { text: uri, width: 200, height: 200, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    } catch (e) {
        qr.textContent = 'QR unavailable';
    }

    startBtcPolling();
}

// Watch Midgard for a completed BTC -> ETH swap that paid out to this wallet.
function startBtcPolling() {
    if (btcPollTimer) clearInterval(btcPollTimer);
    const startedAt = Math.floor(Date.now() / 1000);
    const status = document.getElementById('btcStatus');
    btcPollTimer = setInterval(async () => {
        try {
            const { data } = await thorFetch(MIDGARD_URLS, '/v2/actions?address=' + wallet.address + '&type=swap&limit=5&offset=0');
            const actions = data.actions || [];
            for (const a of actions) {
                const ts = Math.floor(Number(a.date) / 1e9);
                if (ts < startedAt - 120) continue;
                if (a.status === 'pending') {
                    status.textContent = 'Bitcoin seen. THORChain is swapping, ETH is on its way.';
                } else if (a.status === 'success') {
                    status.textContent = 'ETH arrived in your wallet.';
                    showToast('Bitcoin top-up complete');
                    clearInterval(btcPollTimer);
                    btcPollTimer = null;
                    if (typeof updateBalance === 'function') updateBalance();
                    return;
                }
            }
        } catch (err) {
            // network hiccup, keep polling
        }
    }, 30000);
}

async function copyText(text, toastMsg) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            fallbackCopyText(text);
        }
        showToast(toastMsg || 'Copied');
    } catch (err) {
        showToast('Copy failed');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function copyAddress() {
    const address = document.getElementById('walletAddress').textContent;
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(address);
            showToast('Address copied to clipboard!');
            return;
        }
    } catch (err) {
        // fall through to fallback
    }

    if (fallbackCopyText(address)) {
        showToast('Address copied to clipboard!');
    } else {
        window.prompt('Copy address:', address);
        showToast('Copy address manually');
    }
}

function fallbackCopyText(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    } catch (err) {
        return false;
    }
}

async function pasteAddress() {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            document.getElementById('recipientAddress').value = text;
            showToast('Address pasted');
        } else {
            showToast('Please paste manually');
        }
    } catch (err) {
        showToast('Please paste manually');
    }
}

function convertUSDtoETH() {
    const usdAmount = parseFloat(document.getElementById('sendAmountUSD').value) || 0;
    const price = getEffectivePrice();
    const ethAmount = price ? usdAmount / price : 0;
    document.getElementById('sendAmount').value = ethAmount.toFixed(6);
}

async function sendETH() {
    if (!wallet || !provider) {
        showToast('Wallet not connected');
        return;
    }

    const recipient = document.getElementById('recipientAddress').value.trim();
    const amount = document.getElementById('sendAmount').value;

    if (!ethers.utils.isAddress(recipient)) {
        showToast('Invalid recipient address');
        return;
    }

    if (!amount || parseFloat(amount) <= 0) {
        showToast('Invalid amount');
        return;
    }

    try {
        showToast('Preparing transaction...');
        const value = ethers.utils.parseEther(amount);
        const baseTx = {
            to: recipient,
            from: wallet.address,
            value
        };
        const gasLimit = await provider.estimateGas(baseTx);
        const feeData = await provider.getFeeData();

        const tx = {
            to: recipient,
            value,
            gasLimit
        };

        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            tx.maxFeePerGas = feeData.maxFeePerGas;
            tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        } else if (feeData.gasPrice) {
            tx.gasPrice = feeData.gasPrice;
        }

        const transaction = await wallet.sendTransaction(tx);
        showToast('Transaction sent! Hash: ' + transaction.hash.substring(0, 10) + '...');
        
        await transaction.wait();
        showToast('Transaction confirmed!');
        
        closeModal('sendModal');
        await updateBalance();
    } catch (error) {
        showToast('Transaction failed: ' + error.message);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

updateNetworkBadge();
startMarketWatcher();
showLandingPanels();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            // The wallet still runs normally if offline caching is unavailable.
        });
    });
}
