// ─── PWA Service Worker (inline blob) ────────────────────────────
const CACHE_VERSION = 'salat-v1';

const SW_CODE = `
const CACHE = '${CACHE_VERSION}';
const ASSETS = ['./', './adhan.mp3'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
`;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const blob  = new Blob([SW_CODE], { type: 'text/javascript' });
  const swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl);
}

// ─── PWA Manifest (inline blob) ───────────────────────────────────
export function injectManifest() {
  const manifest = {
    name:             'مواقيت الصلاة',
    short_name:       'Salat',
    start_url:        '.',
    display:          'fullscreen',
    background_color: '#0a0a2e',
    theme_color:      '#0a0a2e',
    orientation:      'any',
    icons:            [],
  };
  const blob  = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const link  = document.createElement('link');
  link.rel    = 'manifest';
  link.href   = URL.createObjectURL(blob);
  document.head.appendChild(link);
}
