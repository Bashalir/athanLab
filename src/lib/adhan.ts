import type { PrayerTimes } from '../types';
import { NAMES_FR } from './prayerCalc';
type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// ─── Adhan Audio ──────────────────────────────────────────────────
const AUDIO_BASE = import.meta.env.BASE_URL;
const SRC_FAJR = `${AUDIO_BASE}athan-fajr.mp3`;
const SRC_DEFAULT = `${AUDIO_BASE}athan.mp3`;

// Two DOM-embedded <audio> elements — iOS requires elements in the DOM
// and unlocked individually. Changing src after unlock re-locks on iOS 9.
let audioFajr: HTMLAudioElement | null = null;
let audioDefault: HTMLAudioElement | null = null;

function ensureAudioElements() {
  if (audioFajr) return;
  audioFajr = document.createElement('audio');
  audioFajr.src = SRC_FAJR;
  audioFajr.preload = 'auto';
  audioFajr.setAttribute('playsinline', '');
  audioFajr.setAttribute('webkit-playsinline', '');
  audioFajr.style.display = 'none';
  document.body.appendChild(audioFajr);

  audioDefault = document.createElement('audio');
  audioDefault.src = SRC_DEFAULT;
  audioDefault.preload = 'auto';
  audioDefault.setAttribute('playsinline', '');
  audioDefault.setAttribute('webkit-playsinline', '');
  audioDefault.style.display = 'none';
  document.body.appendChild(audioDefault);
}

function safePlay(audio: HTMLAudioElement) {
  try {
    var maybePromise = audio.play() as Promise<void> | void;
    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      maybePromise.catch(function() {});
    }
  } catch (e) {
    // Ignore play errors on restricted browsers.
  }
}

export function pauseAdhan() {
  if (audioFajr) audioFajr.pause();
  if (audioDefault) audioDefault.pause();
}

export function setupAdhanAudioUnlock() {
  var unlocked = false;
  var unlock = function() {
    if (unlocked) return;
    unlocked = true;
    ensureAudioElements();
    // Unlock both elements with a near-silent play inside the user gesture.
    [audioFajr, audioDefault].forEach(function(a) {
      if (!a) return;
      a.volume = 0.01;
      safePlay(a);
      setTimeout(function() {
        a.pause();
        a.currentTime = 0;
        a.volume = 1;
      }, 150);
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
  ensureAudioElements();
  const audio = prayerKey === 'fajr' ? audioFajr! : audioDefault!;
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
