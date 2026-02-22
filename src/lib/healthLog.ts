import { storageGet, storageSet, storageRemove } from './safeStorage';

const HEALTH_LOG_KEY = 'app_health_log';
const MAX_ENTRIES = 120;

export function appendHealthLog(event: string): void {
  try {
    const existing = storageGet(HEALTH_LOG_KEY);
    const list = existing ? JSON.parse(existing) as string[] : [];
    const safe = String(event || '').replace(/\s+/g, ' ').trim();
    list.push(`${new Date().toISOString()} ${safe}`);
    storageSet(HEALTH_LOG_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // Ignore storage failures on old/restricted browsers.
  }
}

export function readHealthLog(): string[] {
  try {
    const raw = storageGet(HEALTH_LOG_KEY);
    const list = raw ? JSON.parse(raw) as unknown : [];
    return Array.isArray(list) ? list.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

export function clearHealthLog(): void {
  storageRemove(HEALTH_LOG_KEY);
}

