import { useState, useEffect, useRef } from 'react';
import type { WeatherConfig, WeatherData } from '../types';
import { fetchWeather } from '../lib/weatherServices';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useWeather(
  lat:     number,
  lng:     number,
  config:  WeatherConfig
): WeatherData | null {
  const [data, setData]   = useState<WeatherData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (config.service === 'none') {
      setData(null);
      return;
    }

    const load = async () => {
      const result = await fetchWeather(lat, lng, config);
      if (result) setData(result);
    };

    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lat, lng, config.service, config.apiKey]);

  return data;
}
