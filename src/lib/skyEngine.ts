import type { SkyState, PrayerTimes } from '../types';

// ─── Sky State Definitions ────────────────────────────────────────
export const SKY_STATES: SkyState[] = [
  { name: 'night',   top: '#03030f', bot: '#07091a', h: 'transparent',            ho: 0,   stars: 1,   clouds: 0,   glow: 'rgba(100,100,200,0.0)' },
  { name: 'fajr',    top: '#0e0520', bot: '#2d0b55', h: 'rgba(120,40,180,0.6)',   ho: 0.7, stars: 0.6, clouds: 0,   glow: 'rgba(180,100,255,0.5)' },
  { name: 'sunrise', top: '#1a1060', bot: '#4a1a00', h: 'rgba(255,100,30,0.9)',   ho: 1,   stars: 0.1, clouds: 0.3, glow: 'rgba(255,140,50,0.8)'  },
  { name: 'morning', top: '#1a6fa8', bot: '#7ab8e0', h: 'rgba(200,230,255,0.2)',  ho: 0.3, stars: 0,   clouds: 0.5, glow: 'rgba(200,230,255,0.3)' },
  { name: 'dhuhr',   top: '#0e5fa0', bot: '#5aaddf', h: 'rgba(180,220,255,0.1)',  ho: 0.2, stars: 0,   clouds: 0.6, glow: 'rgba(180,220,255,0.2)' },
  { name: 'asr',     top: '#1060a0', bot: '#7bbde8', h: 'rgba(240,200,100,0.25)', ho: 0.4, stars: 0,   clouds: 0.5, glow: 'rgba(240,190,80,0.4)'  },
  { name: 'maghrib', top: '#1a0a00', bot: '#6b2000', h: 'rgba(255,80,0,1)',        ho: 1,   stars: 0.2, clouds: 0.2, glow: 'rgba(255,100,0,0.9)'   },
  { name: 'dusk',    top: '#0a0520', bot: '#200a40', h: 'rgba(200,60,30,0.5)',    ho: 0.6, stars: 0.7, clouds: 0,   glow: 'rgba(200,60,60,0.4)'   },
];

// ─── Color Helpers ────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

export function blendHex(h1: string, h2: string, t: number): string {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const r = ([0, 1, 2] as const).map(i => Math.round(lerp(a[i], b[i], t)));
  return `rgb(${r[0]},${r[1]},${r[2]})`;
}

export function blend(s1: SkyState, s2: SkyState, t: number): SkyState {
  return {
    top:    blendHex(s1.top, s2.top, t),
    bot:    blendHex(s1.bot, s2.bot, t),
    h:      s2.h,
    ho:     lerp(s1.ho, s2.ho, t),
    stars:  lerp(s1.stars, s2.stars, t),
    clouds: lerp(s1.clouds, s2.clouds, t),
    glow:   s2.glow,
  };
}

// ─── Sky State for Current Time ───────────────────────────────────
export function getSkyStateForTime(nowMins: number, prayers: PrayerTimes): SkyState {
  const { fajr, dhuhr, asr, maghrib, isha } = prayers;
  const { sunriseMins, sunsetMins } = prayers._raw;

  const f  = fajr.mins ?? 0;
  const sr = sunriseMins ?? 0;
  const d  = dhuhr.mins ?? 0;
  const a  = asr.mins ?? 0;
  const ss = sunsetMins ?? maghrib.mins ?? 0;
  const mg = maghrib.mins ?? 0;
  const is = isha.mins ?? 0;

  const W = 25; // transition window in minutes

  function t(from: number, to: number) {
    if (nowMins < from) return 0;
    if (nowMins > to)   return 1;
    return (nowMins - from) / (to - from);
  }

  if (nowMins < f - W)     return { ...SKY_STATES[0] };
  if (nowMins < f + W)     return blend(SKY_STATES[0], SKY_STATES[1], t(f - W, f + W));
  if (nowMins < sr - W)    return { ...SKY_STATES[1] };
  if (nowMins < sr + W)    return blend(SKY_STATES[1], SKY_STATES[2], t(sr - W, sr + W));
  if (nowMins < sr + 60)   return blend(SKY_STATES[2], SKY_STATES[3], t(sr + W, sr + 60));
  if (nowMins < d + W)     return { ...SKY_STATES[3] };
  if (nowMins < d + W * 2) return blend(SKY_STATES[3], SKY_STATES[4], t(d, d + W * 2));
  if (nowMins < a - W)     return { ...SKY_STATES[4] };
  if (nowMins < a + W)     return blend(SKY_STATES[4], SKY_STATES[5], t(a - W, a + W));
  if (nowMins < ss - W)    return { ...SKY_STATES[5] };
  if (nowMins < ss + W)    return blend(SKY_STATES[5], SKY_STATES[6], t(ss - W, ss + W));
  if (nowMins < mg + 30)   return blend(SKY_STATES[6], SKY_STATES[7], t(ss + W, mg + 30));
  if (nowMins < is - W)    return { ...SKY_STATES[7] };
  if (nowMins < is + W)    return blend(SKY_STATES[7], SKY_STATES[0], t(is - W, is + W));
  return { ...SKY_STATES[0] };
}

// ─── Sun Halo Style ───────────────────────────────────────────────
export interface SunHaloStyle {
  background: string;
  opacity: string;
}

export function computeSunHalo(
  nowMins: number,
  sunriseMins: number,
  sunsetMins: number
): SunHaloStyle | null {
  if (nowMins < sunriseMins || nowMins > sunsetMins) return null;

  const progress = (nowMins - sunriseMins) / (sunsetMins - sunriseMins);
  const pct      = (progress * 100).toFixed(1) + '%';
  const arc      = Math.sin(progress * Math.PI);

  const isHorizon = progress < 0.18 || progress > 0.82;

  const r0 = 255;
  const g0 = isHorizon ? Math.round(160 + arc * 70)  : Math.round(230 + arc * 25);
  const b0 = isHorizon ? Math.round(40  + arc * 80)  : Math.round(120 + arc * 135);
  const a0 = (0.55 + arc * 0.3).toFixed(2);

  const r1 = 255;
  const g1 = isHorizon ? Math.round(100 + arc * 60) : Math.round(200 + arc * 40);
  const b1 = isHorizon ? 0                           : Math.round(60  + arc * 100);
  const a1 = (0.18 + arc * 0.14).toFixed(2);

  const background = [
    `radial-gradient(ellipse 70% 55% at ${pct} 75%,`,
    `  rgba(${r0},${g0},${b0},${a0}) 0%,`,
    `  rgba(${r1},${g1},${b1},${a1}) 30%,`,
    `  transparent 70%)`,
  ].join(' ');

  return { background, opacity: '1' };
}
