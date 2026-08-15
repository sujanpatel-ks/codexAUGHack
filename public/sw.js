// AgroCare AI Service Worker for Offline Persistence & PWA
const CACHE_NAME = 'agrocare-cache-v1';
const RUNTIME_CACHE = 'agrocare-runtime-v1';

// Core assets to pre-cache on install for offline boot
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  '/src/data/mandi-data.json',
  '/src/data/market_data.json'
];

// Offline fallback diagnosis response in case API is completely offline
const OFFLINE_DIAGNOSIS_FALLBACK = {
  crop: "Coconut",
  disease: "Bud Rot (Phytophthora palmivora)",
  diseaseHi: "बड रॉट (कलिका सड़न)",
  diseaseKn: "ಮೊಗ್ಗು ಕೊಳೆ ರೋಗ",
  confidence: 98,
  description: "Offline Cached Record: Characterized by yellowing/withering of the central spear leaf followed by dark brown soft rot at the crown base.",
  symptoms: [
    "Yellowing and wilting of the heart leaf",
    "Foul smell from rotting crown tissues",
    "Water-soaked dark lesions on leaf bases"
  ],
  prevention: {
    immediate: [
      "Cut and burn severely damaged crown tissue",
      "Apply 1% Bordeaux mixture or Copper Oxychloride to crown"
    ],
    longTerm: [
      "Ensure proper garden drainage during monsoons",
      "Maintain 7.5m spacing between palms to reduce humidity"
    ]
  },
  treatment: {
    organic: {
      name: "Bordeaux Mixture 1% Paste & Pseudomonas Flurescens",
      nameHi: "बोर्डो मिश्रण 1% और स्यूडोमोनास",
      dosage: "50g paste applied directly to affected bud region",
      frequency: "Once immediately, repeat after 15 days",
      precautions: "Apply in dry morning conditions; protect healthy palms nearby",
      costEstimate: "₹ 350 / Hectare"
    },
    chemical: {
      name: "Mancozeb 75 WP or Metalaxyl 8% + Mancozeb 64% WP",
      nameHi: "मेंकोजेब या मेटालेक्सिल",
      dosage: "2.5g per Liter of clean water",
      frequency: "Every 14-21 days during rainy weather",
      precautions: "Use protective mask & gloves; avoid spraying on open flowers",
      costEstimate: "₹ 480 / Hectare"
    }
  },
  actionRequired: "Immediate Crown Treatment & Isolation",
  severity: "High",
  isOfflineCache: true
};

// Install event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[ServiceWorker] Some pre-cache assets failed to load:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Apply network and caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  // Ignore chrome-extension and non-http schemes
  if (!request.url.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML Pages): Network-First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackIndex = await caches.match('/index.html');
          if (fallbackIndex) return fallbackIndex;
          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;
          return new Response('<h1>AgroCare AI is running in offline mode.</h1>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 2. API Routes: Network-first with cache fallback and synthetic offline responses
  if (requestUrl.pathname.startsWith('/api/')) {
    // For diagnosis API: If network fails, serve fallback cached result
    if (requestUrl.pathname.includes('/gemini/diagnose') || requestUrl.pathname.includes('/diagnoses')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok && request.method === 'GET') {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(async () => {
            console.warn('[ServiceWorker] Offline diagnosis request fallback triggered');
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response(JSON.stringify(OFFLINE_DIAGNOSIS_FALLBACK), {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            });
          })
      );
      return;
    }

    // Generic API routes: Network-first, fallback to runtime cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: 'Network unavailable. Running in offline mode.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        })
    );
    return;
  }

  // 3. Static Assets (Scripts, CSS, Images, Fonts, JSON): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline and not in cache
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
