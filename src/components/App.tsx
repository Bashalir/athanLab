import { useEffect } from 'react';
import { useAppState }      from '../hooks/useAppState';
import { useClock }         from '../hooks/useClock';
import { useWeather }       from '../hooks/useWeather';
import { checkAdhan, setupAdhanAudioUnlock } from '../lib/adhan';
import { registerServiceWorker } from '../lib/pwa';
import { LoadingScreen }    from './LoadingScreen';
import { SkySection }       from './SkySection';
import { NextPrayerBanner } from './NextPrayerBanner';
import { PrayerBar }        from './PrayerBar';

import '../styles/tokens.css';
import '../styles/global.css';

export function App() {
  const { state, dispatch } = useAppState();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isLegacyIOS = /iPad|iPhone|iPod/i.test(ua)
    && (/OS 9_/i.test(ua) || document.documentElement.classList.contains('no-css-vars'));
  const { nowMins, clockDisplay, dateDisplay, skyState, isDebugTime } = useClock(
    state.prayers, state.debug, state.fakeMinutes
  );
  const weatherConfig = isLegacyIOS ? { service: 'none', apiKey: '' } : state.weatherConfig;
  const weather = useWeather(state.lat, state.lng, weatherConfig);

  const logHealth = (event: string) => {
    try {
      const key = 'app_health_log';
      const existing = localStorage.getItem(key);
      const list = existing ? JSON.parse(existing) as string[] : [];
      list.push(`${new Date().toISOString()} ${event}`);
      localStorage.setItem(key, JSON.stringify(list.slice(-40)));
    } catch {
      // Ignore logging failures on restricted browsers.
    }
  };

  // PWA init (once)
  useEffect(() => {
    registerServiceWorker();
    setupAdhanAudioUnlock();
    logHealth('startup');
  }, []);

  // Force-stable defaults on iPad 2 / iOS 9 kiosk.
  useEffect(() => {
    if (!isLegacyIOS) return;
    if (state.weatherConfig.service !== 'none') {
      dispatch({ type: 'SET_WEATHER_CONFIG', config: { service: 'none', apiKey: '' } });
    }
  }, [isLegacyIOS, state.weatherConfig.service, dispatch]);

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
      logHealth(`watchdog_miss_${misses}`);
      if (misses >= 3) {
        logHealth('watchdog_reload');
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
        logHealth('scheduled_reload_0330');
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
