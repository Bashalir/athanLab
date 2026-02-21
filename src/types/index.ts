import type { Theme } from '../lib/themes';

// ─── Prayer Times ──────────────────────────────────────────────────
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerEntry {
  label: string;   // Arabic name
  fr: string;      // French name
  time: string;    // HH:MM
  mins: number | null; // minutes since midnight
}

export interface PrayerTimes {
  fajr: PrayerEntry;
  dhuhr: PrayerEntry;
  asr: PrayerEntry;
  maghrib: PrayerEntry;
  isha: PrayerEntry;
  _raw: {
    sunrise: number | null;
    sunset: number | null;
    sunriseMins: number | null;
    sunsetMins: number | null;
  };
}

export type CalculationMethod = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'UOIF';

// ─── Sky State ─────────────────────────────────────────────────────
export interface SkyState {
  name?: string;
  top: string;
  bot: string;
  h: string;
  ho: number;
  stars: number;
  clouds: number;
  glow: string;
}

// ─── Weather ───────────────────────────────────────────────────────
export type WeatherService = 'none' | 'openmeteo' | 'openweathermap' | 'weatherapi' | 'accuweather' | 'meteofrance';

export interface WeatherConfig {
  service: WeatherService;
  apiKey: string;
}

export interface WeatherData {
  icon: string;
  temp: string;
  desc: string;
  wind: string;
}

// ─── Theme (re-export from lib/themes) ────────────────────────────
export type { Theme };

// ─── App State ─────────────────────────────────────────────────────
export interface AppState {
  lat: number;
  lng: number;
  cityName: string;
  method: CalculationMethod;
  prayers: PrayerTimes | null;
  customJSON: Record<string, unknown> | null;
  debug: boolean;
  fakeMinutes: number | null;
  settingsOpen: boolean;
  weatherConfig: WeatherConfig;
  theme: Theme;
}

export type AppAction =
  | { type: 'SET_LOCATION'; lat: number; lng: number; cityName: string }
  | { type: 'SET_METHOD'; method: CalculationMethod }
  | { type: 'SET_PRAYERS'; prayers: PrayerTimes }
  | { type: 'SET_CUSTOM_JSON'; json: Record<string, unknown> | null; cityName?: string }
  | { type: 'SET_DEBUG'; debug: boolean }
  | { type: 'SET_FAKE_MINUTES'; fakeMinutes: number | null }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'SET_WEATHER_CONFIG'; config: WeatherConfig }
  | { type: 'SET_THEME'; theme: Theme };
