import type { WeatherData } from '../types';

interface Props {
  cityName:    string;
  weather:     WeatherData | null;
  onSettings:  () => void;
}

export function TopBar({ cityName, weather, onSettings }: Props) {
  return (
    <div className="top-bar">
      <div className="top-bar-center">
        <table className="top-weather-table" role="presentation">
          <tbody>
            <tr>
              <td className="top-bar-icon-cell"><span className="top-bar-icon">{weather?.icon ?? '🌤'}</span></td>
              <td className="top-bar-city-cell"><span className="top-bar-city">{cityName.toUpperCase()}</span></td>
              <td className="top-bar-temp-cell"><span className="top-bar-temp">{weather?.temp ?? '--°'}</span></td>
              <td className="top-bar-desc-cell"><span className="top-bar-desc">{weather?.desc ?? ''}</span></td>
              <td className="top-bar-wind-cell">
                {weather?.wind ? <span className="top-bar-wind">· {weather.wind} km/h</span> : null}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="top-bar-right">
        <button className="settings-btn" onClick={onSettings}>⚙</button>
      </div>
    </div>
  );
}
