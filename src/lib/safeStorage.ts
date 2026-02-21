export function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in private mode / restricted browsers.
  }
}

export function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in private mode / restricted browsers.
  }
}
