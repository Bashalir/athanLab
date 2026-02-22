export function httpGetText(url: string, timeoutMs = 10000): Promise<string> {
  if (typeof XMLHttpRequest === 'function') {
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
  return httpGetText(url, timeoutMs).then((txt) => JSON.parse(txt) as T);
}
