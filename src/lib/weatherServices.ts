import type { WeatherConfig, WeatherData, WeatherService } from '../types';
import { appendHealthLog } from './healthLog';
import { httpGetJSON } from './http';

// ─── WMO Weather Codes ────────────────────────────────────────────
const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};

const WMO_DESC: Record<number, string> = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses', 81: 'Averses', 82: 'Fortes averses',
  95: 'Orage', 96: 'Orage grêle', 99: 'Orage fort',
};

export const WEATHER_HINTS: Partial<Record<WeatherService, string>> = {
  openmeteo:      'Aucune clé requise — fonctionne directement',
  openweathermap: 'Inscription gratuite sur openweathermap.org → "API Keys"',
  weatherapi:     'Inscription gratuite sur weatherapi.com → Dashboard',
  accuweather:    'Inscription sur developer.accuweather.com',
  meteofrance:    'Inscription sur portail-api.meteofrance.fr',
};

export const WEATHER_NEEDS_KEY: WeatherService[] = [
  'openweathermap', 'weatherapi', 'accuweather', 'meteofrance',
];

async function getJSON(url: string): Promise<any> {
  return httpGetJSON(url, 8000);
}

// ─── Fetch Functions ──────────────────────────────────────────────
async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://athan-lab.fotoproia.workers.dev/?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;
  const d = await getJSON(url);
  const c = d.current;
  const code = c.weather_code ?? c.weathercode ?? 0;
  return {
    icon: WMO_ICONS[code] ?? '🌡',
    temp: `${Math.round(c.temperature_2m)}°`,
    desc: WMO_DESC[code] ?? '',
    wind: String(Math.round(c.windspeed_10m)),
  };
}

async function fetchOWM(lat: number, lng: number, key: string): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric&lang=fr`;
  const d = await getJSON(url);
  const id = d.weather[0].id as number;
  const icon = id <= 232 ? '⛈' : id <= 531 ? '🌧' : id <= 622 ? '❄️' : id <= 781 ? '🌫' : id === 800 ? '☀️' : id <= 804 ? '⛅' : '🌡';
  return {
    icon,
    temp: `${Math.round(d.main.temp)}°`,
    desc: d.weather[0].description,
    wind: String(Math.round(d.wind.speed * 3.6)),
  };
}

async function fetchWeatherAPI(lat: number, lng: number, key: string): Promise<WeatherData> {
  const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${lat},${lng}&lang=fr`;
  const d = await getJSON(url);
  const c = d.current;
  const code = c.condition.code as number;
  const icon = code <= 1000 ? '☀️' : code <= 1006 ? '⛅' : code <= 1030 ? '🌫' : c.is_day ? '🌦' : '🌧';
  return {
    icon,
    temp: `${Math.round(c.temp_c)}°`,
    desc: c.condition.text,
    wind: String(Math.round(c.wind_kph)),
  };
}

// ─── Public API ───────────────────────────────────────────────────
export async function fetchWeather(
  lat: number,
  lng: number,
  config: WeatherConfig
): Promise<WeatherData | null> {
  const { service, apiKey } = config;
  try {
    if (service === 'openmeteo')                    return await fetchOpenMeteo(lat, lng);
    if (service === 'openweathermap' && apiKey)     return await fetchOWM(lat, lng, apiKey);
    if (service === 'weatherapi' && apiKey)         return await fetchWeatherAPI(lat, lng, apiKey);
  } catch (e) {
    const msg = (e as Error).message || 'unknown';
    console.warn(`Weather [${service}]:`, msg);
    appendHealthLog(`weather_error service=${service} msg=${msg}`);
  }
  return null;
}
