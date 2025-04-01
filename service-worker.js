const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `eetcafe-kenitra-cache-${CACHE_VERSION}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/mobile.js',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js',
    'https://js.stripe.com/v3/',
];
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install event triggered.');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([...urlsToCache, OFFLINE_PAGE]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/styles.css') || event.request.url.includes('/script.js')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => caches.match(event.request))
        );
    } else if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_PAGE);
            })
        );
    } else if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        console.error('[Service Worker] Fetch failed, serving cached response if available.');
                        return cachedResponse || new Response('Offline content not available.', { status: 503 });
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else {
        event.respondWith(
            fetch(event.request).catch(() => {
                console.error('[Service Worker] Network request failed.');
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || new Response('Offline content not available.', { status: 503 });
                });
            })
        );
    }
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate event triggered.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] All old caches deleted. Claiming clients...');
            return self.clients.claim();
        })
    );
});

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push event received:', event);
    try {
        const data = event.data ? event.data.json() : {};
        console.log('[Service Worker] Push data:', data);
        const title = data.title || 'Eetcafé Kenitra';
        const options = {
            body: data.body || 'Er is een update voor uw bestelling.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            data: data.url || '/',
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error('[Service Worker] Error handling push event:', error);
        const fallbackTitle = 'Eetcafé Kenitra';
        const fallbackOptions = {
            body: 'Er is een nieuwe melding, maar we konden de details niet laden.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
        };
        event.waitUntil(self.registration.showNotification(fallbackTitle, fallbackOptions));
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});