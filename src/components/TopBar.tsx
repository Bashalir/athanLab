import type { WeatherData } from '../types';

interface Props {
  cityName:    string;
  weather:     WeatherData | null;
  onSettings:  () => void;
}

export function TopBar({ cityName, weather, onSettings }: Props) {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-icon">{weather?.icon ?? '🌤'}</span>
        <span className="top-bar-city">{cityName.toUpperCase()}</span>
        <span className="top-bar-temp">{weather?.temp ?? '--°'}</span>
        <span className="top-bar-desc">{weather?.desc ?? ''}</span>
        {weather?.wind && (
          <span className="top-bar-wind">· {weather.wind} km/h</span>
        )}
      </div>
      <div className="top-bar-right">
        <button className="settings-btn" onClick={onSettings}>⚙</button>
      </div>
    </div>
  );
}
