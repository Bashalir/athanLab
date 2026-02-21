import { useEffect, useRef } from 'react';
import type { PrayerTimes, SkyState } from '../types';
import { computeSunHalo } from '../lib/skyEngine';
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
  const bgRef   = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const sunRef  = useRef<HTMLDivElement>(null);

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

  // Apply sun halo or moon
  useEffect(() => {
    if (!prayers) return;
    const halo  = haloRef.current;
    const moon  = moonRef.current;
    const sun   = sunRef.current;
    const sr    = prayers._raw.sunriseMins ?? 0;
    const ss    = prayers._raw.sunsetMins  ?? 0;

    if (nowMins >= sr && nowMins <= ss) {
      // Day: show halo
      const style = computeSunHalo(nowMins, sr, ss);
      if (halo && style) {
        halo.style.background = style.background;
        halo.style.opacity    = style.opacity;
      }
      
      if (sun) {
        sun.style.opacity = '1';
        const W = window.innerWidth;
        const skyEl = bgRef.current?.parentElement;
        const skyH = skyEl ? skyEl.offsetHeight : 400;
        const dayLen = ss - sr;
        const progress = (nowMins - sr) / dayLen;
        
        // Trajectoire parabolique : Lever (0) -> Zénith (0.5) -> Coucher (1)
        const x = progress * W;
        const arcHeight = skyH * 0.75; // Monte jusqu'à 75% de la hauteur
        const y = -arcHeight * 4 * progress * (1 - progress);
        
        sun.style.left = `${x}px`;
        sun.style.top = `${y}px`;
      }
      if (moon) moon.style.opacity = '0';
    } else {
      // Night: show moon arc
      if (halo) halo.style.opacity = '0';
      if (sun) sun.style.opacity = '0';
      if (!moon) return;

      moon.style.opacity = '1';
      const W        = window.innerWidth;
      const skyEl    = bgRef.current?.parentElement;
      const skyH     = skyEl ? skyEl.offsetHeight : 400;
      const nightLen = 24 * 60 - (ss - sr);
      const progress = nowMins > ss
        ? (nowMins - ss) / nightLen
        : (nowMins + 24 * 60 - ss) / nightLen;
      const x         = progress * W;
      const arcHeight = skyH * 0.65;
      const y         = -arcHeight * 4 * Math.min(progress, 1) * (1 - Math.min(progress, 1));
      moon.style.left = `${x}px`;
      moon.style.top  = `${y}px`;
    }
  }, [nowMins, prayers]);

  // Calcul de la date Hégirienne (approximative selon le calendrier local)
  const { dateLabel: hijriDate, day: hijriDay } = getHijriInfo();

  // Génération du chemin SVG pour la phase de la lune
  const getMoonPath = (day: number) => {
    const r = 13; 
    const topY = 16 - r;
    const botY = 16 + r;
    
    // Normalize day 1..30 to phase 0..1
    // Day 1 = New Moon (0), Day 15 = Full Moon (0.5), Day 30 = New Moon (1)
    const phase = (day - 1) / 29.5;
    const isWaxing = phase <= 0.5;
    
    // Angle for terminator
    const angle = phase * 2 * Math.PI;
    const tr = r * Math.cos(angle);
    const rx = Math.abs(tr);
    
    if (isWaxing) {
      // Right side is the "base" (Outer arc)
      // Terminator moves from Right edge (New) to Left edge (Full)
      const sweep = tr > 0 ? 0 : 1;
      return `M 16 ${topY} A ${r} ${r} 0 0 1 16 ${botY} A ${rx} ${r} 0 0 ${sweep} 16 ${topY}`;
    } else {
      // Left side is the "base"
      // Terminator moves from Left edge (Full) to Right edge (New)
      const sweep = tr > 0 ? 1 : 0;
      return `M 16 ${topY} A ${r} ${r} 0 0 0 16 ${botY} A ${rx} ${r} 0 0 ${sweep} 16 ${topY}`;
    }
  };
  const moonPath = getMoonPath(hijriDay);

  return (
    <div className="sky-section">
      <div className="sky-bg" ref={bgRef} />
      <div className="screen-frame" />
      <div className="islamic-grid" />
      
      {/* Structure de la Porte de Mosquée */}
      <div className="mosque-arch-overlay">
        {/* Rendu Vectoriel Intégré (SVG Inline) */}
        <img
          src="/ramadan.svg"
          className="arch-image"
          alt=""
          aria-hidden="true"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="fanoos left"><div className="fanoos-chain" /><div className="fanoos-body"><div className="fanoos-light" /></div></div>
        <div className="fanoos right"><div className="fanoos-chain" /><div className="fanoos-body"><div className="fanoos-light" /></div></div>
      </div>

      <div className="central-ornament" />
      <div className="sun-halo" ref={haloRef} />

      {/* Moon */}
      <div className="sun-track">
        {/* Sun Body */}
        <div ref={sunRef} className="sun-body" />
        <div
          ref={moonRef}
          style={{
            position:     'absolute',
            width:        '32px',
            height:       '32px',
            opacity:      0,
            transition:   'opacity 2s ease',
          }}
        >
          <svg viewBox="0 0 32 32" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="moonGradient" cx="35%" cy="35%" r="80%">
                <stop offset="0%" stopColor="#fffde7" />
                <stop offset="100%" stopColor="#e0d090" />
              </radialGradient>
            </defs>
            <path 
              d={moonPath} 
              fill="url(#moonGradient)" 
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,240,150,0.6))' }}
            />
          </svg>
        </div>
      </div>

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
