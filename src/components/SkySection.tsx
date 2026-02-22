import { useEffect, useRef } from 'react';
import type { PrayerTimes, SkyState } from '../types';
import { TopBar } from './TopBar';
import { SettingsPanel } from './settings/SettingsPanel';
import type { WeatherData, WeatherConfig, CalculationMethod, Theme } from '../types';
import type { AppAction } from '../types';

interface Props {
  skyState:      SkyState | null;
  prayers:       PrayerTimes | null;
  nowMins:       number;
  clockDisplay:  string;
  dateDisplay:   string;
  isDebugTime:   boolean;
  cityName:      string;
  weather:       WeatherData | null;
  settingsOpen:  boolean;
  method:        CalculationMethod;
  debug:         boolean;
  weatherConfig: WeatherConfig;
  customJSON:    Record<string, unknown> | null;
  lat:           number;
  lng:           number;
  theme:         Theme;
  dispatch:      React.Dispatch<AppAction>;
}

export function SkySection({
  skyState, prayers, nowMins, clockDisplay, dateDisplay, isDebugTime,
  cityName, weather, settingsOpen, method, debug, weatherConfig,
  customJSON, lat, lng, theme, dispatch,
}: Props) {
  const bgRef = useRef<HTMLDivElement>(null);

  // Calcul du dégradé dynamique selon l'heure de la prière
  const getDynamicSkyGradient = () => {
    if (!prayers) return null;
    const { sunriseMins } = prayers._raw;
    const fajrMins    = prayers.fajr.mins;
    const dhuhrMins   = prayers.dhuhr.mins;
    const asrMins     = prayers.asr.mins;
    const maghribMins = prayers.maghrib.mins;
    const ishaMins    = prayers.isha.mins;
    const t = nowMins;

    // Nuit (Avant Fajr)
    if (t < (fajrMins ?? 0)) return 'linear-gradient(to bottom, #020205, #080810)';
    
    // Aube (Fajr -> Lever du soleil) : Bleu nuit vers lueur rosée
    if (t < (sunriseMins ?? 0)) return 'linear-gradient(to bottom, #1F1C2C, #5b4b68, #d48e94)';
    
    // Matin (Lever -> Dhuhr) : Ciel bleu clair et lumineux (Daytime)
    if (t < (dhuhrMins ?? 0)) return 'linear-gradient(to bottom, #2980B9, #6DD5FA, #ffffff)';
    
    // Zénith (Dhuhr -> Asr) : Turquoise intense et vibrant (High Noon)
    if (t < (asrMins ?? 0)) return 'linear-gradient(to bottom, #009FFF, #ec2F4B)'; /* Non, trop vif. */
    if (t < (asrMins ?? 0)) return 'linear-gradient(to bottom, #36D1DC, #5B86E5)';
    
    // Après-midi (Asr -> Maghrib) : Bleu profond vers Orange (Golden Hour)
    if (t < (maghribMins ?? 0)) return 'linear-gradient(to bottom, #2b5876, #4e4376, #f3904f)';
    
    // Crépuscule (Maghrib -> Isha) : Violet sombre et nuit tombante (Dusk)
    if (t < (ishaMins ?? 0)) return 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)';
    
    // Nuit (Après Isha)
    return 'linear-gradient(to bottom, #020205, #080810)';
  };

  useEffect(() => {
    if (!bgRef.current) return;
    
    const dynamicGradient = getDynamicSkyGradient();
    
    if (dynamicGradient) {
      bgRef.current.style.background = dynamicGradient;
    } else if (skyState) {
      // Fallback si pas de prières chargées
      bgRef.current.style.background = `linear-gradient(to bottom, ${skyState.top} 0%, ${skyState.bot} 100%)`;
    }
  }, [skyState, prayers, nowMins]);

  // Calcul de la date Hégirienne (approximative selon le calendrier local)
  const { dateLabel: hijriDate } = getHijriInfo();

  return (
    <div className="sky-section">
      <div className="sky-bg" ref={bgRef} />
      <div className="screen-frame" />
      <div className="islamic-grid" />

      {/* Time display */}
      <div className="time-display">
        <div className={`clock${isDebugTime ? ' debug' : ''}`}>{clockDisplay}</div>
        <div className="time-divider" />
        <div className="date-container">
          <div className="date-gregorian">{dateDisplay}</div>
          <div className="date-hijri">{hijriDate}</div>
        </div>
      </div>

      {/* Top bar */}
      <TopBar
        cityName={cityName}
        weather={weather}
        onSettings={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
      />

      {/* Settings panel */}
      <SettingsPanel
        open={settingsOpen}
        method={method}
        debug={debug}
        weatherConfig={weatherConfig}
        cityName={cityName}
        customJSON={customJSON}
        lat={lat}
        lng={lng}
        theme={theme}
        dispatch={dispatch}
      />
    </div>
  );
}
const getHijriInfo = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const hijriMonthsFr = [
    'mouharram',
    'safar',
    'rabi al-awwal',
    'rabi ath-thani',
    'joumada al-oula',
    'joumada ath-thania',
    'rajab',
    'chaabane',
    'ramadan',
    'chawwal',
    'dhou al-qiada',
    'dhou al-hijja',
  ];

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const parts = fmt.formatToParts(now);
      const dPart = parts.find((p) => p.type === 'day')?.value;
      const mPart = parts.find((p) => p.type === 'month')?.value || '';
      const yPart = parts.find((p) => p.type === 'year')?.value || '';
      const dNum = parseInt(dPart || '15', 10);
      const dateLabel = `${dPart || '15'} ${mPart} ${yPart}`.toUpperCase();
      return { dateLabel, day: Number.isFinite(dNum) ? dNum : 15 };
    }
  } catch {
    // Fallback below.
  }

  // Civil conversion fallback for legacy browsers.
  const gToJd = (y: number, m: number, d: number) => {
    const a = Math.floor((14 - m) / 12);
    const y2 = y + 4800 - a;
    const m2 = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * m2 + 2) / 5) +
      365 * y2 +
      Math.floor(y2 / 4) -
      Math.floor(y2 / 100) +
      Math.floor(y2 / 400) -
      32045
    );
  };
  const iToJd = (y: number, m: number, d: number) =>
    d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439 - 1;
  const jdToHijri = (jd: number) => {
    const y = Math.floor((30 * (jd - 1948439) + 10646) / 10631);
    let m = Math.ceil((jd - 29 - iToJd(y, 1, 1)) / 29.5) + 1;
    m = Math.min(12, Math.max(1, m));
    const d = jd - iToJd(y, m, 1) + 1;
    return { d, m, y };
  };

  // Align fallback with commonly observed Umm al-Qura dates.
  const FALLBACK_OFFSET_DAYS = -1;
  const hijri = jdToHijri(gToJd(year, month, day) + FALLBACK_OFFSET_DAYS);
  const monthName = hijriMonthsFr[hijri.m - 1] || 'ramadan';
  return {
    dateLabel: `${hijri.d} ${monthName} ${hijri.y}`.toUpperCase(),
    day: hijri.d,
  };
};
