export function httpGetText(url: string, timeoutMs = 10000): Promise<string> {
  if (typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = timeoutMs;
        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText || '');
            return;
          }
          reject(new Error(`HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Timeout'));
        xhr.send();
      } catch (e) {
        reject(e);
      }
    });
  }
  return Promise.reject(new Error('XHR unavailable'));
}

export function httpGetJSON<T = unknown>(url: string, timeoutMs = 10000): Promise<T> {
  return httpGetText(url, timeoutMs).then((txt) => {
    const body = (txt || '').trim();
    if (!body) {
      throw new Error('Empty response');
    }
    try {
      return JSON.parse(body) as T;
    } catch {
      const preview = body.slice(0, 40).replace(/\s+/g, ' ');
      throw new Error(`Invalid JSON: ${preview}`);
    }
  });
}
