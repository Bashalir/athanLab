import { useEffect } from 'react';
import { useAppState }      from '../hooks/useAppState';
import { useClock }         from '../hooks/useClock';
import { useWeather }       from '../hooks/useWeather';
import { checkAdhan, setupAdhanAudioUnlock } from '../lib/adhan';
import { registerServiceWorker } from '../lib/pwa';
import { appendHealthLog, rotateHealthLogForBuild } from '../lib/healthLog';
import { httpGetText } from '../lib/http';
import { LoadingScreen }    from './LoadingScreen';
import { SkySection }       from './SkySection';
import { NextPrayerBanner } from './NextPrayerBanner';
import { PrayerBar }        from './PrayerBar';

import '../styles/tokens.css';
import '../styles/global.css';

declare const __BUILD_ID__: string;
declare const __APP_VERSION__: string;

function getLatestIndexHTML(url: string): Promise<string> {
  return httpGetText(url).catch(() => '');
}

export function App() {
  const { state, dispatch } = useAppState();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isLegacyIOS = /iPad|iPhone|iPod/i.test(ua)
    && (/OS 9_/i.test(ua) || document.documentElement.classList.contains('no-css-vars'));
  const { nowMins, clockDisplay, dateDisplay, skyState, isDebugTime } = useClock(
    state.prayers, state.debug, state.fakeMinutes
  );
  const weather = useWeather(state.lat, state.lng, state.weatherConfig);
  const FORCE_TOKEN_KEY = 'force_reload_token_seen';

  // PWA init (once)
  useEffect(() => {
    rotateHealthLogForBuild(__APP_VERSION__);
    registerServiceWorker();
    setupAdhanAudioUnlock();
    appendHealthLog('startup');
  }, []);

  // Auto-update: poll latest index and reload when a new build is detected.
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    const check = async () => {
      const html = await getLatestIndexHTML(`${base}index.html?ts=${Date.now()}`);
      if (!html) return;
      const srcMatch = html.match(/data-src=\"([^\"]+)\"/) || html.match(/src=\"([^\"]*index-legacy[^\"]*\.js)\"/);
      if (!srcMatch || !srcMatch[1]) return;
      const scriptPath = srcMatch[1];
      const scriptURL = scriptPath.startsWith('http')
        ? scriptPath
        : `${window.location.origin}${scriptPath}`;
      const js = await getLatestIndexHTML(`${scriptURL}${scriptURL.includes('?') ? '&' : '?'}ts=${Date.now()}`);
      const match = js.match(/salat-\d+/);
      if (!match) return;
      if (match[0] !== __BUILD_ID__) {
        appendHealthLog(`autoupdate_reload_${match[0]}`);
        window.location.reload();
      }
    };
    const id = window.setInterval(check, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // Remote force-reload command for kiosk/PWA devices.
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    const readSeen = () => {
      try { return localStorage.getItem(FORCE_TOKEN_KEY) || ''; } catch { return ''; }
    };
    const writeSeen = (value: string) => {
      try { localStorage.setItem(FORCE_TOKEN_KEY, value); } catch { /* ignore */ }
    };
    const check = async () => {
      const token = (await getLatestIndexHTML(`${base}force-reload.txt?ts=${Date.now()}`)).trim();
      if (!token) return;
      const seen = readSeen();
      if (!seen) {
        writeSeen(token);
        appendHealthLog(`force_token_init_${token}`);
        return;
      }
      if (seen !== token) {
        writeSeen(token);
        appendHealthLog(`force_reload_${token}`);
        window.location.reload();
      }
    };
    check();
    const id = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // Watchdog: if app root becomes empty repeatedly, force a reload.
  useEffect(() => {
    if (!isLegacyIOS) return;
    let misses = 0;
    const id = window.setInterval(() => {
      const root = document.getElementById('root');
      const app = document.getElementById('app');
      const ok = !!root && root.childElementCount > 0 && !!app;
      if (ok) {
        misses = 0;
        return;
      }
      misses += 1;
      appendHealthLog(`watchdog_miss_${misses}`);
      if (misses >= 3) {
        appendHealthLog('watchdog_reload');
        window.location.reload();
      }
    }, 60000);
    return () => window.clearInterval(id);
  }, [isLegacyIOS]);

  // Preventive daily reload at 03:30 for long-run kiosk stability.
  useEffect(() => {
    if (!isLegacyIOS) return;
    const marker = `${new Date().toDateString()}-0330`;
    if (nowMins === 210) {
      const key = 'daily_reload_marker';
      const done = localStorage.getItem(key);
      if (done !== marker) {
        localStorage.setItem(key, marker);
        appendHealthLog('scheduled_reload_0330');
        window.location.reload();
      }
    }
  }, [isLegacyIOS, nowMins]);

  // Check adhan each tick
  useEffect(() => {
    if (state.prayers && !state.fakeMinutes) {
      checkAdhan(nowMins, state.prayers);
    }
  }, [nowMins, state.prayers, state.fakeMinutes]);

  return (
    <>
      <LoadingScreen />
      <div id="app">
        <SkySection
          skyState={skyState}
          prayers={state.prayers}
          nowMins={nowMins}
          clockDisplay={clockDisplay}
          dateDisplay={dateDisplay}
          isDebugTime={isDebugTime}
          cityName={state.cityName}
          weather={weather}
          settingsOpen={state.settingsOpen}
          method={state.method}
          debug={state.debug}
          weatherConfig={state.weatherConfig}
          customJSON={state.customJSON}
          lat={state.lat}
          lng={state.lng}
          theme={state.theme}
          dispatch={dispatch}
        />

        {state.prayers && (
          <NextPrayerBanner prayers={state.prayers} nowMins={nowMins} />
        )}

        {state.prayers ? (
          <PrayerBar
            prayers={state.prayers}
            nowMins={nowMins}
            debug={state.debug}
            onFakeTime={mins => dispatch({ type: 'SET_FAKE_MINUTES', fakeMinutes: mins })}
          />
        ) : (
          <div className="prayer-section" />
        )}
      </div>
    </>
  );
}
