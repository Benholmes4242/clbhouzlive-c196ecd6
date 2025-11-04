// Basic Service Worker for Push Notifications
// NOTE: Does NOT cache Vite chunks to avoid chunk loading errors
const CACHE_NAME = 'clbhouz-notifications-v2';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    Promise.all([
      // Clean up only old notification caches, NOT Vite chunks
      caches.keys().then(keys => 
        Promise.all(
          keys
            .filter(k => k.startsWith('clbhouz-notifications-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
        )
      ),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Explicitly DO NOT intercept fetch for Vite chunks
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache or interfere with:
  // - Vite dev server chunks (node_modules/.vite/*)
  // - Build assets with query params (*.js?v=*)
  // - Any .js, .css, .map files
  if (
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/assets/') ||
    url.search.includes('?v=') ||
    /\.(js|css|map)$/.test(url.pathname)
  ) {
    // Let browser handle these directly, no SW interference
    return;
  }
  
  // For everything else, just pass through
  // (we're only using SW for push notifications)
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Clbhouz', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Clbhouz', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        
        // No existing window found, open a new one
        return self.clients.openWindow('/');
      })
  );
});