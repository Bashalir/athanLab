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

  // Civil conversion (tabular Islamic calendar) for legacy browsers.
  const gToJd = (y: number, m: number, d: number) =>
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d -
    32075;

  const jdToHijri = (jd: number) => {
    let l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j =
      Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
      Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l =
      l -
      Math.floor(((30 - j) / 15) * ((17719 * j) / 50)) -
      Math.floor((j / 16) * ((15238 * j) / 43)) +
      29;
    const m = Math.floor((24 * l) / 709);
    const d = l - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return { d, m, y };
  };

  const hijri = jdToHijri(gToJd(year, month, day));
  const monthName = hijriMonthsFr[hijri.m - 1] || 'ramadan';
  const dateLabel = `${hijri.d} ${monthName} ${hijri.y}`.toUpperCase();

  return {
    dateLabel,
    day: hijri.d,
  };
};
