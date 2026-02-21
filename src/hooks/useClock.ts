import { useState, useEffect, useRef } from 'react';
import type { PrayerTimes } from '../types';
import { getSkyStateForTime } from '../lib/skyEngine';
import type { SkyState } from '../types';

const DAYS   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export interface ClockState {
  nowMins:      number;
  clockDisplay: string;   // "HH:MM"
  dateDisplay:  string;   // "Lundi 3 Février 2025"
  skyState:     SkyState | null;
  isDebugTime:  boolean;
}

export function useClock(
  prayers:     PrayerTimes | null,
  debug:       boolean,
  fakeMinutes: number | null
): ClockState {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const now        = new Date();
  const realMins   = now.getHours() * 60 + now.getMinutes();
  const isDebug    = debug && fakeMinutes !== null;
  const nowMins    = isDebug ? fakeMinutes! : realMins;

  const displayH   = String(Math.floor(nowMins / 60) % 24).padStart(2, '0');
  const displayM   = String(nowMins % 60).padStart(2, '0');
  const clockDisplay = `${displayH}:${displayM}`;

  const dateDisplay = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const skyState = prayers ? getSkyStateForTime(nowMins, prayers) : null;

  return { nowMins, clockDisplay, dateDisplay, skyState, isDebugTime: isDebug };
}
