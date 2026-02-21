import type { PrayerTimes } from '../types';
import { NAMES_AR } from '../lib/prayerCalc';

const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

interface Props {
  prayers: PrayerTimes;
  nowMins: number;
}

export function NextPrayerBanner({ prayers, nowMins }: Props) {
  let nextKey: string | null = null;
  let minDiff = Infinity;
  KEYS.forEach(k => {
    const m = prayers[k].mins;
    if (m !== null && m > nowMins && m - nowMins < minDiff) {
      minDiff = m - nowMins;
      nextKey = k;
    }
  });

  let text: string;
  if (nextKey) {
    const diff = (prayers[nextKey].mins ?? 0) - nowMins;
    const h    = Math.floor(diff / 60);
    const m    = diff % 60;
    const label = h > 0 ? `${h}h ${m}min` : `${m} min`;
    text = `${NAMES_AR[nextKey]} dans ${label}`;
  } else {
    text = 'Fajr demain';
  }

  return <div className="next-prayer-banner">{text}</div>;
}
