/* ================================================================
   SERVICE WORKER - Route Ledger Pro
   ================================================================ */

const CACHE_NAME = 'route-ledger-v1.0.0';
const urlsToCache = [
 '/Route-Ledger-Pro/',
  '/Route-Ledger-Pro/index.html',
  '/Route-Ledger-Pro/style.css',
  '/Route-Ledger-Pro/script.js',
  '/Route-Ledger-Pro/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// ---- Install Service Worker ----
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Service Worker: Caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Service Worker: All files cached!');
        return self.skipWaiting();
      })
  );
});

// ---- Activate Service Worker ----
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(function() {
      console.log('✅ Service Worker: Activated and controlling page!');
      return self.clients.claim();
    })
  );
});

// ---- Fetch from Cache (Network-first with fallback) ----
self.addEventListener('fetch', function(event) {
   // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // If network request succeeds, cache it
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(function() {
        // If network fails, try cache
        return caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            // Fallback for offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ---- Handle Push Notifications (if implemented) ----
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('🚀 Route Ledger', options)
  );
});

// ---- Handle Notification Click ----
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
