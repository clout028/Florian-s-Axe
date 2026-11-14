/* Offline support: cache the game's files so it runs without a connection
   once it has been opened. Bump VERSION whenever files change. */
const VERSION = 'fa-v3';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/data.js',
  './js/character.js',
  './js/engine.js',
  './js/combat.js',
  './js/icons.js',
  './js/meta.js',
  './js/puzzles.js',
  './js/art.js',
  './js/sound.js',
  './js/narrate.js',
  './js/story/hub.js',
  './js/story/prologue.js',
  './js/story/mire.js',
  './js/story/mines.js',
  './js/story/harbor.js',
  './js/story/barrow.js',
  './js/story/peak.js',
  './js/story/orchard.js',
  './js/story/court.js',
  './js/story/wych.js',
  './js/story/interludes.js',
  './js/story/villain.js',
  './js/story/personal.js',
  './js/story/finale.js',
  './js/ai.js',
  './js/ui.js',
  './js/puzzle-ui.js',
  './js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Network first, so updates show up straight away; fall back to the cache when offline. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
      if (hit) return hit;
      throw err;
    }
  }));
});
