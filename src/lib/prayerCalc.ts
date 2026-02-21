import type { CalculationMethod, PrayerTimes } from '../types';

// ─── Calculation Methods ───────────────────────────────────────────
export const METHODS: Record<CalculationMethod, { fajr: number; isha: number }> = {
  MWL:     { fajr: 18,   isha: 17 },
  ISNA:    { fajr: 15,   isha: 15 },
  Egypt:   { fajr: 19.5, isha: 17.5 },
  Makkah:  { fajr: 18.5, isha: 90 }, // isha = minutes after maghrib
  Karachi: { fajr: 18,   isha: 18 },
  Tehran:  { fajr: 17.7, isha: 14 },
  UOIF:    { fajr: 12,   isha: 12 },
};

export const NAMES_FR: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};
export const NAMES_AR: Record<string, string> = {
  fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};

// ─── Math Helpers ─────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function fixAngle(a: number) { return a - 360 * Math.floor(a / 360); }
function fixHour(a: number) { return a - 24 * Math.floor(a / 24); }

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const dec = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  const EqT = q / 15 - fixHour(RA);
  return { dec, EqT };
}

function julianDate(year: number, month: number, day: number) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// ─── Main Computation ─────────────────────────────────────────────
export function computePrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  method: CalculationMethod = 'UOIF'
): PrayerTimes {
  const m = METHODS[method] ?? METHODS.UOIF;
  const y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();
  const jd = julianDate(y, mo, d) - lng / (15 * 24);
  const { dec, EqT } = sunPosition(jd);

  const transit = 12 - EqT - lng / 15;

  function hourAngle(angle: number): number | null {
    const num = -Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec));
    const den = Math.cos(toRad(lat)) * Math.cos(toRad(dec));
    if (Math.abs(num / den) > 1) return null;
    return toDeg(Math.acos(num / den)) / 15;
  }

  function asrAngle(factor: number) {
    return -toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec))))));
  }

  const sunriseHA = hourAngle(0.833);
  const fajrHA    = hourAngle(m.fajr);
  const ishaHA    = typeof m.isha === 'number' && m.isha < 24 ? hourAngle(m.isha) : null;
  const asrHA     = hourAngle(asrAngle(1));

  const sunrise = sunriseHA !== null ? fixHour(transit - sunriseHA) : null;
  const sunset  = sunriseHA !== null ? fixHour(transit + sunriseHA) : null;
  const fajr    = fajrHA !== null ? fixHour(transit - fajrHA) : null;
  const dhuhr   = fixHour(transit + 0.017);
  const asr     = asrHA !== null ? fixHour(transit + asrHA) : null;
  const maghrib = sunset;

  let isha: number | null;
  if (m.isha >= 24) {
    isha = maghrib !== null ? fixHour(maghrib + m.isha / 60) : null;
  } else {
    isha = ishaHA !== null ? fixHour(transit + ishaHA) : null;
  }

  const tz = -date.getTimezoneOffset() / 60;

  function fmt(h: number | null): string {
    if (h === null) return '--:--';
    const adjusted = fixHour(h + tz);
    const hh = Math.floor(adjusted);
    const mm = Math.round((adjusted - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  function toMins(h: number | null): number | null {
    if (h === null) return null;
    const adjusted = fixHour(h + tz);
    return Math.floor(adjusted) * 60 + Math.round((adjusted - Math.floor(adjusted)) * 60);
  }

  return {
    fajr:    { label: NAMES_AR.fajr,    fr: NAMES_FR.fajr,    time: fmt(fajr),    mins: toMins(fajr) },
    dhuhr:   { label: NAMES_AR.dhuhr,   fr: NAMES_FR.dhuhr,   time: fmt(dhuhr),   mins: toMins(dhuhr) },
    asr:     { label: NAMES_AR.asr,     fr: NAMES_FR.asr,     time: fmt(asr),     mins: toMins(asr) },
    maghrib: { label: NAMES_AR.maghrib, fr: NAMES_FR.maghrib, time: fmt(maghrib), mins: toMins(maghrib) },
    isha:    { label: NAMES_AR.isha,    fr: NAMES_FR.isha,    time: fmt(isha),    mins: toMins(isha) },
    _raw: {
      sunrise, sunset,
      sunriseMins: toMins(sunrise),
      sunsetMins:  toMins(sunset),
    },
  };
}

// ─── Parse Custom JSON ────────────────────────────────────────────
export function parseCustomJSON(json: Record<string, unknown>): PrayerTimes {
  const now = new Date();
  const y   = String(now.getFullYear());
  const mon = String(now.getMonth() + 1);
  const d   = String(now.getDate());

  function timeToMins(t: string): number | null {
    if (!t || t === '--:--') return null;
    const [h, mm] = t.split(':').map(Number);
    return isNaN(h) ? null : h * 60 + mm;
  }

  function build(obj: Record<string, string>): PrayerTimes {
    const keys: Array<keyof PrayerTimes & string> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const result: Partial<PrayerTimes> = {};
    keys.forEach(k => {
      const t = (obj[k] ?? obj[k.charAt(0).toUpperCase() + k.slice(1)] ?? '--:--') as string;
      (result as Record<string, unknown>)[k] = { label: NAMES_AR[k], fr: NAMES_FR[k], time: t, mins: timeToMins(t) };
    });
    const r = result as PrayerTimes;
    const sr = r.fajr.mins    ? r.fajr.mins + 70    : 420;
    const ss = r.maghrib.mins  ? r.maghrib.mins - 5  : 1170;
    r._raw = { sunrise: null, sunset: null, sunriseMins: sr, sunsetMins: ss };
    return r;
  }

  const data = json as Record<string, Record<string, Record<string, Record<string, string>>>>;

  if (data[y]?.[mon]?.[d])   return build(data[y][mon][d]);
  if (!data[y] && data[mon]?.[d]) return build((data[mon] as Record<string, Record<string, string>>)[d]);

  if (Array.isArray(json)) {
    const today = now.toISOString().slice(0, 10);
    const arr = json as Array<Record<string, string>>;
    const found = arr.find(e => e.date === today) ?? arr[0];
    return build(found);
  }

  return build(json as Record<string, string>);
}
