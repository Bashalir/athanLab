import type { PrayerTimes } from '../types';
import { PrayerItem } from './PrayerItem';
import { triggerAdhan } from '../lib/adhan';

const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

interface Props {
  prayers:     PrayerTimes;
  nowMins:     number;
  debug:       boolean;
  onFakeTime:  (mins: number) => void;
}

export function PrayerBar({ prayers, nowMins, debug, onFakeTime }: Props) {
  // Find next prayer; after Isha, cycle back to Fajr
  let nextKey: string | null = null;
  let minDiff = Infinity;
  KEYS.forEach(k => {
    const m = prayers[k].mins;
    if (m !== null && m > nowMins && m - nowMins < minDiff) {
      minDiff = m - nowMins;
      nextKey = k;
    }
  });
  if (!nextKey) nextKey = 'fajr';

  return (
    <div className="prayer-section">
      {KEYS.map(k => (
        <PrayerItem
          key={k}
          prayerKey={k}
          entry={prayers[k]}
          isNext={k === nextKey}
          isPast={k !== nextKey && prayers[k].mins !== null && prayers[k].mins! < nowMins}
          debug={debug}
          onDebugClick={() => {
            const mins = prayers[k].mins;
            if (mins !== null) onFakeTime(mins - 1);
            triggerAdhan(k);
          }}
        />
      ))}
    </div>
  );
}
