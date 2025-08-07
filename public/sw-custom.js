// Custom Service Worker for Bank Transaction Manager
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'btm-v1';
const DYNAMIC_CACHE = 'btm-dynamic-v1';
const TRANSACTION_CACHE = 'btm-transactions-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/transactions',
  '/import',
  '/admin',
  '/manifest.json',
  '/icon.svg',
  '/icon-simple.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE && name !== TRANSACTION_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests to Supabase
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(TRANSACTION_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Only cache GET requests
      if (request.method === 'GET') {
        await cache.put(request, networkResponse.clone());
      }
      
      // Store transaction data in IndexedDB for offline access
      if (request.url.includes('frontend_transactions_view')) {
        const data = await networkResponse.clone().json();
        await storeTransactionsOffline(data);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, serving from cache:', error);
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Data may not be up to date.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const dynamicCache = await caches.open(DYNAMIC_CACHE);
      await dynamicCache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(CACHE_NAME);
      return offlineCache.match('/') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Store transactions in IndexedDB for offline access
async function storeTransactionsOffline(data) {
  try {
    // This will be implemented with the IndexedDB module
    const message = {
      type: 'CACHE_TRANSACTIONS',
      payload: data
    };
    
    // Send to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(message);
    });
  } catch (error) {
    console.error('[SW] Failed to store transactions offline:', error);
  }
}

// Background sync for offline department assignments
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered');
  
  if (event.tag === 'sync-department-assignments') {
    event.waitUntil(syncDepartmentAssignments());
  }
});

// Sync offline department assignments
async function syncDepartmentAssignments() {
  try {
    // Get pending assignments from IndexedDB
    const message = {
      type: 'SYNC_ASSIGNMENTS',
    };
    
    // Notify clients to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(message);
    });
    
    console.log('[SW] Department assignments synced');
  } catch (error) {
    console.error('[SW] Failed to sync assignments:', error);
    throw error; // Retry later
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    case 'CACHE_TRANSACTIONS':
      cacheTransactions(event.data.payload);
      break;
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

// Cache specific transactions
async function cacheTransactions(transactions) {
  try {
    const cache = await caches.open(TRANSACTION_CACHE);
    // Store transactions as JSON response
    const response = new Response(JSON.stringify(transactions), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/cached-transactions', response);
    console.log('[SW] Transactions cached');
  } catch (error) {
    console.error('[SW] Failed to cache transactions:', error);
  }
}