import { useState } from 'react';
import type { WeatherConfig, WeatherService, AppAction } from '../../types';
import { WEATHER_HINTS, WEATHER_NEEDS_KEY } from '../../lib/weatherServices';

const SERVICES: Array<{ value: WeatherService; label: string }> = [
  { value: 'none',          label: '— Désactivé —' },
  { value: 'openmeteo',     label: 'Open-Meteo (gratuit, sans clé)' },
  { value: 'openweathermap',label: 'OpenWeatherMap (clé API gratuite)' },
  { value: 'weatherapi',    label: 'WeatherAPI.com (clé API gratuite)' },
  { value: 'accuweather',   label: 'AccuWeather (clé API)' },
  { value: 'meteofrance',   label: 'Météo France API (token requis)' },
];

interface Props {
  config:   WeatherConfig;
  dispatch: React.Dispatch<AppAction>;
  onClose:  () => void;
}

export function WeatherSection({ config, dispatch, onClose }: Props) {
  const [selectedService, setSelectedService] = useState<WeatherService>(config.service);
  const [apiKey, setApiKey] = useState('');

  const needsKey = WEATHER_NEEDS_KEY.includes(selectedService);
  const isActive = config.service !== 'none';

  function handleServiceChange(svc: WeatherService) {
    setSelectedService(svc);
    if (svc === config.service) setApiKey(config.apiKey);
    else setApiKey('');

    // If no key needed, save immediately
    if (!WEATHER_NEEDS_KEY.includes(svc)) {
      dispatch({ type: 'SET_WEATHER_CONFIG', config: { service: svc, apiKey: '' } });
      if (svc !== 'none') onClose();
    }
  }

  function saveKey() {
    if (!apiKey.trim()) { alert('Clé vide'); return; }
    dispatch({ type: 'SET_WEATHER_CONFIG', config: { service: selectedService, apiKey: apiKey.trim() } });
    onClose();
  }

  return (
    <div className="setting-section">
      <div className="setting-title">
        Service météo{' '}
        <span className="weather-service-tag">{isActive ? 'actif' : 'désactivé'}</span>
      </div>

      <select
        className="weather-service-select"
        value={selectedService}
        onChange={e => handleServiceChange(e.target.value as WeatherService)}
      >
        {SERVICES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {needsKey && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="settings-input"
            placeholder="Coller votre clé API ici..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <button className="s-btn primary" onClick={saveKey}>Enregistrer</button>
          <div className="location-info">{WEATHER_HINTS[selectedService] ?? ''}</div>
        </div>
      )}
    </div>
  );
}
