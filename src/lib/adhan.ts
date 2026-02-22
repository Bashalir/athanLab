import type { PrayerTimes } from '../types';
import { NAMES_AR, NAMES_FR } from './prayerCalc';

// ─── Adhan Audio ──────────────────────────────────────────────────
const audioCache: Record<string, HTMLAudioElement> = {};
const AUDIO_BASE = import.meta.env.BASE_URL;
const SRC_FAJR = `${AUDIO_BASE}athan-fajr.mp3`;
const SRC_DEFAULT = `${AUDIO_BASE}athan.mp3`;
const isLegacyIOS = (() => {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua)
    && (/OS 9_/i.test(ua) || document.documentElement.classList.contains('no-css-vars'));
})();

function getAudio(src: string): HTMLAudioElement {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
    audioCache[src].preload = 'auto';
  }
  return audioCache[src];
}

export function pauseAdhan() {
  Object.values(audioCache).forEach(a => a.pause());
}

export function setupAdhanAudioUnlock() {
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const targets = [SRC_FAJR, SRC_DEFAULT].map(getAudio);
    targets.forEach((a) => {
      a.muted = true;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        })
        .catch(() => {
          a.muted = false;
        });
    });
    document.removeEventListener('touchend', unlock);
    document.removeEventListener('click', unlock);
  };

  document.addEventListener('touchend', unlock, { passive: true });
  document.addEventListener('click', unlock);
}

// ─── Adhan Trigger ────────────────────────────────────────────────
const playedPrayers = new Set<string>();
let lastCheckedDate = '';

export function checkAdhan(nowMins: number, prayers: PrayerTimes) {
  const today   = new Date().toDateString();
  const nowSecs = new Date().getSeconds();

  if (today !== lastCheckedDate) {
    playedPrayers.clear();
    lastCheckedDate = today;
  }

  const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  keys.forEach(k => {
    const p   = prayers[k];
    const key = `${today}-${k}`;
    if (p.mins === null) return;
    if (p.mins === nowMins && nowSecs < 30 && !playedPrayers.has(key)) {
      playedPrayers.add(key);
      triggerAdhan(k);
    }
  });
}

export function triggerAdhan(prayerKey: string) {
  const src = prayerKey === 'fajr' ? SRC_FAJR : SRC_DEFAULT;
  const audio = getAudio(src);
  audio.currentTime = 0;
  audio.play().catch(() => {});
  // On iPad 2 / iOS 9 kiosk, visual overlays can crash WebKit during audio playback.
  if (!isLegacyIOS) showAdhanAlert(prayerKey);
}

// ─── Adhan Alert (DOM) ────────────────────────────────────────────
export function showAdhanAlert(prayerKey: string) {
  const existing = document.getElementById('adhan-alert');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'adhan-alert';
  // Legacy-safe modal styling for old Safari/iPad engines.
  div.style.position = 'fixed';
  div.style.top = '50%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.zIndex = '99999';
  div.style.background = 'rgba(10,8,30,0.96)';
  div.style.border = '1px solid rgba(46,204,113,0.35)';
  div.style.borderRadius = '18px';
  div.style.padding = '24px 22px';
  div.style.textAlign = 'center';
  div.style.boxShadow = '0 0 40px rgba(0,0,0,0.5)';
  div.style.width = '88%';
  div.style.maxWidth = '420px';
  div.style.opacity = '1';
  div.style.display = 'block';

  div.innerHTML = `
    <style>
      @keyframes adhanGlow {
        0%, 100% { text-shadow: 0 0 20px rgba(46,204,113,0.4); }
        50%       { text-shadow: 0 0 50px rgba(255,215,0,0.9), 0 0 100px rgba(255,180,0,0.4); }
      }
    </style>
    <div style="font-family:'Amiri',serif;font-size:2.8rem;color:#2ecc71;animation:adhanGlow 2s ease-in-out infinite;margin-bottom:8px;">
      ${NAMES_AR[prayerKey] ?? prayerKey}
    </div>
    <div style="font-size:0.9rem;color:rgba(255,255,255,0.5);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">
      ${NAMES_FR[prayerKey] ?? prayerKey}
    </div>
    <div style="font-family:'Amiri',serif;font-size:1.1rem;color:rgba(46,204,113,0.6);margin:16px 0;">
      الله أكبر الله أكبر
    </div>
    <button id="adhan-close-btn"
      style="margin-top:12px;padding:8px 24px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);cursor:pointer;font-family:'Outfit',sans-serif;font-size:0.78rem;letter-spacing:0.1em;">
      ✕ Fermer
    </button>
  `;

  document.body.appendChild(div);

  const src = prayerKey === 'fajr' ? SRC_FAJR : SRC_DEFAULT;
  div.querySelector('#adhan-close-btn')?.addEventListener('click', () => {
    getAudio(src).pause();
    div.remove();
  });

  const audio = getAudio(src);
  audio.onended = () => setTimeout(() => div.remove(), 3000);
  setTimeout(() => { if (div.parentNode) div.remove(); }, 10 * 60 * 1000);
}
