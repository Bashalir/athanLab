import type { PrayerTimes } from '../types';
import { NAMES_AR, NAMES_FR } from './prayerCalc';

// ─── Adhan Audio ──────────────────────────────────────────────────
let adhanAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!adhanAudio) {
    adhanAudio = new Audio('./adhan.mp3');
    adhanAudio.preload = 'auto';
  }
  return adhanAudio;
}

export function pauseAdhan() {
  getAudio().pause();
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
  const audio = getAudio();
  audio.currentTime = 0;
  audio.play().catch(() => {});
  showAdhanAlert(prayerKey);
}

// ─── Adhan Alert (DOM) ────────────────────────────────────────────
export function showAdhanAlert(prayerKey: string) {
  const existing = document.getElementById('adhan-alert');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'adhan-alert';
  Object.assign(div.style, {
    position:       'fixed',
    top:            '50%',
    left:           '50%',
    transform:      'translate(-50%, -50%) scale(0.8)',
    zIndex:         '50',
    background:     'rgba(10,8,30,0.92)',
    backdropFilter: 'blur(24px)',
    border:         '1px solid rgba(46,204,113,0.35)',
    borderRadius:   '24px',
    padding:        '32px 48px',
    textAlign:      'center',
    animation:      'adhanReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    boxShadow:      '0 0 80px rgba(255,180,0,0.15), 0 0 0 1px rgba(255,215,0,0.1)',
  } as CSSStyleDeclaration);

  div.innerHTML = `
    <style>
      @keyframes adhanReveal {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
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

  div.querySelector('#adhan-close-btn')?.addEventListener('click', () => {
    getAudio().pause();
    div.remove();
  });

  const audio = getAudio();
  audio.onended = () => setTimeout(() => div.remove(), 3000);
  setTimeout(() => { if (div.parentNode) div.remove(); }, 10 * 60 * 1000);
}
