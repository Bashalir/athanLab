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
  const { nowMins, clockDisplay, dateDisplay, skyState, isDebugTime } = useClock(
    state.prayers, state.debug, state.fakeMinutes
  );
  const weather = useWeather(state.lat, state.lng, state.weatherConfig);

  // PWA init (once)
  useEffect(() => {
    registerServiceWorker();
    setupAdhanAudioUnlock();
  }, []);

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
