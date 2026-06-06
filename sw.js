// Minimal Service Worker for Ethereum Wallet PWA
// Caches the app shell + vendor files + price data for basic offline use.

const CACHE_NAME = 'eth-wallet-v1';
const SHELL_FILES = [
  './',
  './ethereum-wallet.html',
  './index.html',
  './manifest.json',
  './vendor/ethers.umd.min.js',
  './vendor/qrcode.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for our shell and vendor
  if (SHELL_FILES.some((f) => url.pathname.endsWith(f.replace('./', '')) || url.pathname === f)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // For CoinGecko price (network first, fallback to cache if offline)
  if (url.hostname.includes('coingecko.com')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: try network, fallback to cache for same-origin
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
