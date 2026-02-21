import type { CalculationMethod, WeatherConfig, AppAction, Theme } from '../../types';
import { LocationSection }  from './LocationSection';
import { MethodSection }    from './MethodSection';
import { WeatherSection }   from './WeatherSection';
import { AthanSection }     from './AthanSection';
import { DebugSection }     from './DebugSection';
import { JSONSection }      from './JSONSection';
import { ThemeSection }     from './ThemeSection';

interface Props {
  open:          boolean;
  method:        CalculationMethod;
  debug:         boolean;
  weatherConfig: WeatherConfig;
  cityName:      string;
  theme:         Theme;
  customJSON?:   Record<string, unknown> | null;
  lat?:          number;
  lng?:          number;
  dispatch:      React.Dispatch<AppAction>;
}

export function SettingsPanel({
  open, method, debug, weatherConfig, cityName, theme, customJSON = null,
  lat = 48.8566, lng = 2.3522, dispatch,
}: Props) {
  function close() { dispatch({ type: 'CLOSE_SETTINGS' }); }

  return (
    <div className={`settings-panel${open ? ' open' : ''}`}>
      <div className="settings-header">
        <span className="settings-title-main">Paramètres</span>
        <button className="settings-close" onClick={close}>✕</button>
      </div>

      <div className="settings-body">
        <LocationSection
          cityName={cityName}
          lat={lat}
          lng={lng}
          dispatch={dispatch}
          onClose={close}
        />

        <div className="divider" />

        <MethodSection method={method} dispatch={dispatch} />

        <div className="divider" />

        <ThemeSection theme={theme} dispatch={dispatch} />

        <div className="divider" />

        <WeatherSection config={weatherConfig} dispatch={dispatch} onClose={close} />

        <div className="divider" />

        <AthanSection onClose={close} />

        <div className="divider" />

        <DebugSection debug={debug} dispatch={dispatch} />

        <div className="divider" />

        <JSONSection customJSON={customJSON} dispatch={dispatch} onClose={close} />
      </div>
    </div>
  );
}
