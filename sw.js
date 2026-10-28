// Minimal Service Worker for Ethereum Wallet PWA.
// Caches the app shell, native app icons, vendor files, and recent price data.

const CACHE_NAME = 'eth-wallet-v5';
const SHELL_FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './assets/app-icon.svg',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/apple-touch-icon.png',
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

  // Leave cross-origin API calls (THORChain, RPCs, etc.) alone; the page handles its own errors.
  if (url.origin !== self.location.origin && !url.hostname.includes('coingecko.com')) {
    return;
  }

  // Network-first for the page itself so updates show up on the next load; cache only when offline
  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for icons and vendor libraries (they only change with a cache name bump)
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

  // Default: try network, fallback to cache for same-origin; never resolve with undefined
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((c) => c || Response.error())
    )
  );
});
