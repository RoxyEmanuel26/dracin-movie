/**
 * Service Worker - roxy-drachin
 * Service worker untuk caching dan offline support
 */

// Konstanta
const CACHE_NAME = 'roxy-drachin-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/browse.html',
  '/detail.html',
  '/watch.html',
  '/search.html',
  '/offline.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/pages.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/security.js',
  '/js/api.js',
  '/js/components.js',
  '/assets/poster-placeholder.svg'
];

// Event install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Event activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Event fetch - network first for API, cache first for static assets
self.addEventListener('fetch', (event) => {
  // Hanya proses request HTTP/HTTPS (abaikan chrome-extension:// dll)
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Bypass Service Worker di localhost agar tidak bentrok dengan Vite HMR (CSS JS module)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Network First untuk API requests
  if (url.hostname === 'www.sankavollerei.com') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone response untuk disimpan ke cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // Return JSON error jika offline
          return new Response(
            JSON.stringify({ error: 'Tidak ada koneksi', offline: true }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        })
    );
    return;
  }

  // Cache First untuk semua request lain
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response untuk disimpan ke cache
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Return offline page jika fetch gagal
            return caches.match('/offline.html');
          });
      })
  );
});
