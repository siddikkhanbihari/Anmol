// ANMOL STORE - High Performance Progressive Web App Service Worker
const CACHE_NAME = 'anmol-store-v2.6.0';

const FALLBACK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23F1F5F9'><rect width='400' height='300'/><circle cx='130' cy='110' r='28' fill='%23CBD5E1'/><path d='M70 230l80-90 60 60 50-65 70 95z' fill='%23CBD5E1'/><text x='200' y='270' font-family='sans-serif' font-size='15' font-weight='700' fill='%2394A3B8' text-anchor='middle'>ANMOL STORE</text></svg>`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/shops.html',
  '/products.html',
  '/services.html',
  '/vehicles.html',
  '/cart.html',
  '/login.html',
  '/register.html',
  '/seller-register.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/cart.js',
  '/js/navigation.js',
  '/js/notifications.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon.svg',
  '/manifest.json'
];

// Install Event: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ANMOL PWA] Pre-caching offline application shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ANMOL PWA] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[ANMOL PWA] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for API, Stale-While-Revalidate for Static Assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 1. API Requests -> Network First with dynamic fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'You are currently offline. Please check your internet connection.',
            offline: true
          }),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. HTML Pages & Documents -> Network First (Never serve outdated cached forms)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match('/index.html')))
    );
    return;
  }

  // 3. Image Requests (/uploads/ or request.destination === 'image' or headers image/*)
  if (url.pathname.startsWith('/uploads/') || request.destination === 'image' || request.headers.get('accept')?.includes('image/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(FALLBACK_SVG, {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        })
    );
    return;
  }

  // 4. Static Assets (CSS, JS, Fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // If offline and request is an HTML navigation, serve cached homepage
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
        throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
