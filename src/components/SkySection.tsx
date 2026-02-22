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
    const monthsFr = [
      'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
    ];
    const fallbackDate = `${now.getDate()} ${monthsFr[now.getMonth()] || ''} ${now.getFullYear()}`.trim();

    // iOS 9 can miss Intl calendar extensions. Keep rendering stable.
    try {
      if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
        throw new Error('Intl unavailable');
      }
      const hijriDateFmt = new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      const hijriDayFmt = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric' });
      const day = parseInt(hijriDayFmt.format(now), 10);
      return {
        dateLabel: hijriDateFmt.format(now),
        day: Number.isFinite(day) ? day : 15,
      };
    } catch {
      // Fallback for old Safari engines.
      return {
        dateLabel: fallbackDate,
        day: now.getDate() || 15,
      };
    }
  };
