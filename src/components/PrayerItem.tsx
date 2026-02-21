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
  const cls = [
    'prayer-item',
    isNext ? 'active' : '',
    isPast ? 'past'   : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      title={debug && entry.mins !== null ? 'Double-clic : simuler cette heure' : undefined}
      style={debug && entry.mins !== null ? { cursor: 'pointer' } : undefined}
      onDoubleClick={debug && onDebugClick ? onDebugClick : undefined}
    >
      <div className="prayer-time">{entry.time}</div>
      <div className="prayer-name-ar">{entry.label}</div>
      <div className="prayer-name-fr">{entry.fr}</div>
    </div>
  );
}
