import { useRef } from 'react';
import type { PrayerEntry } from '../types';

interface Props {
  prayerKey: string;
  entry:     PrayerEntry;
  isNext:    boolean;
  isPast:    boolean;
  debug:     boolean;
  onDebugClick?: () => void;
}

export function PrayerItem({ prayerKey: _key, entry, isNext, isPast, debug, onDebugClick }: Props) {
  const lastTapAtRef = useRef(0);
  const cls = [
    'prayer-item',
    isNext ? 'active' : '',
    isPast ? 'past'   : '',
  ].filter(Boolean).join(' ');

  const handleTouchEnd = () => {
    if (!debug || entry.mins === null || !onDebugClick) return;
    const now = Date.now();
    if (now - lastTapAtRef.current < 350) {
      onDebugClick();
      lastTapAtRef.current = 0;
      return;
    }
    lastTapAtRef.current = now;
  };

  return (
    <div
      className={cls}
      title={debug && entry.mins !== null ? 'Double-clic / double-tap : simuler cette heure' : undefined}
      style={debug && entry.mins !== null ? { cursor: 'pointer' } : undefined}
      onDoubleClick={debug && onDebugClick ? onDebugClick : undefined}
      onTouchEnd={handleTouchEnd}
    >
      <div className="prayer-time">{entry.time}</div>
      <div className="prayer-name-ar">{entry.label}</div>
      <div className="prayer-name-fr">{entry.fr}</div>
    </div>
  );
}
