import type { WeatherData } from '../types';

interface Props {
  cityName:    string;
  weather:     WeatherData | null;
  onSettings:  () => void;
}

export function TopBar({ cityName, weather, onSettings }: Props) {
  return (
    <div className="top-bar">
      <div className="top-bar-right-group">
        <table className="top-weather-table" role="presentation">
          <tbody>
            <tr>
              {weather && <td className="top-bar-icon-cell"><span className="top-bar-icon">{weather.icon}</span></td>}
              <td className="top-bar-city-cell"><span className="top-bar-city">{cityName.toUpperCase()}</span></td>
              {weather && <td className="top-bar-temp-cell"><span className="top-bar-temp">{weather.temp}</span></td>}
              {weather && <td className="top-bar-desc-cell"><span className="top-bar-desc">{weather.desc}</span></td>}
              {weather?.wind && (
                <td className="top-bar-wind-cell"><span className="top-bar-wind">· {weather.wind} km/h</span></td>
              )}
            </tr>
          </tbody>
        </table>
        <button className="settings-btn" onClick={onSettings}>⚙</button>
      </div>
    </div>
  );
}
