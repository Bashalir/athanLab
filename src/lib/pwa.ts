// ─── PWA Service Worker ──────────────────────────────────────────
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL || '/';
  navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
}
