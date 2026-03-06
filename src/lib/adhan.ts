import type { PrayerTimes } from '../types';
import { NAMES_FR } from './prayerCalc';
type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// ─── Adhan Audio ──────────────────────────────────────────────────
const audioCache: Record<string, HTMLAudioElement> = {};
const AUDIO_BASE = import.meta.env.BASE_URL;
const SRC_FAJR = `${AUDIO_BASE}athan-fajr.mp3`;
const SRC_DEFAULT = `${AUDIO_BASE}athan.mp3`;
function safePlay(audio: HTMLAudioElement, onSuccess?: () => void, onFailure?: () => void) {
  try {
    const maybePromise = audio.play() as Promise<void> | void;
    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      maybePromise
        .then(() => { if (onSuccess) onSuccess(); })
        .catch(() => { if (onFailure) onFailure(); });
      return;
    }
    if (onSuccess) onSuccess();
  } catch {
    if (onFailure) onFailure();
  }
}

function getAudio(src: string): HTMLAudioElement {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
    audioCache[src].preload = 'auto';
  }
  return audioCache[src];
}

export function pauseAdhan() {
  for (const src in audioCache) {
    if (Object.prototype.hasOwnProperty.call(audioCache, src)) {
      audioCache[src].pause();
    }
  }
}

export function setupAdhanAudioUnlock() {
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const targets = [SRC_FAJR, SRC_DEFAULT].map(getAudio);
    targets.forEach((a) => {
      a.volume = 0.01;
      safePlay(
        a,
        () => {
          setTimeout(() => {
            a.pause();
            a.currentTime = 0;
            a.volume = 1;
          }, 100);
        },
        () => {
          a.volume = 1;
        }
      );
    });
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('touchend', unlock);
    document.removeEventListener('click', unlock);
  };

  document.addEventListener('touchstart', unlock, { passive: true });
  document.addEventListener('touchend', unlock, { passive: true });
  document.addEventListener('click', unlock);
}

// ─── Adhan Trigger ────────────────────────────────────────────────
const playedPrayers = new Set<string>();
let lastCheckedDate = '';

function syncAdhanDay() {
  const today = new Date().toDateString();
  if (today !== lastCheckedDate) {
    playedPrayers.clear();
    lastCheckedDate = today;
  }
  return today;
}

export function checkAdhan(nowMins: number, prayers: PrayerTimes) {
  const today   = syncAdhanDay();
  const nowSecs = new Date().getSeconds();

  const keys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
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

export function triggerDebugAdhan(prayerKey: PrayerKey, prayers: PrayerTimes) {
  if (prayers[prayerKey].mins === null) return;
  pauseAdhan();
  triggerAdhan(prayerKey);
}

export function triggerAdhan(prayerKey: string) {
  const src = prayerKey === 'fajr' ? SRC_FAJR : SRC_DEFAULT;
  const audio = getAudio(src);
  audio.currentTime = 0;
  audio.volume = 1;
  safePlay(audio);
  showAdhanText(prayerKey);
}

function showAdhanText(prayerKey: string) {
  const id = 'adhan-text-banner';
  const existing = document.getElementById(id);
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  const el = document.createElement('div');
  el.id = id;
  el.textContent = `ADHAN ${String(NAMES_FR[prayerKey] || prayerKey).toUpperCase()}`;
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.bottom = '12px';
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '9999';
  el.style.background = 'rgba(10, 14, 20, 0.9)';
  el.style.border = '1px solid rgba(46, 204, 113, 0.55)';
  el.style.borderRadius = '8px';
  el.style.color = '#eafaf1';
  el.style.fontSize = '16px';
  el.style.fontWeight = '700';
  el.style.letterSpacing = '0.08em';
  el.style.padding = '10px 14px';
  el.style.textAlign = 'center';
  document.body.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 15000);
}
