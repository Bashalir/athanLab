type SimpleResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<SimpleResponse>;

export function installFetchPolyfill(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fetch === 'function') return;
  if (typeof XMLHttpRequest === 'undefined') return;

  const fetchPolyfill: FetchLike = (input, init) => new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const method = (init && init.method) || 'GET';
      xhr.open(method, input, true);
      xhr.timeout = 10000;

      const headers = init && init.headers ? init.headers : {};
      const headerKeys = Object.keys(headers);
      for (let i = 0; i < headerKeys.length; i += 1) {
        const key = headerKeys[i];
        xhr.setRequestHeader(key, headers[key]);
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        const body = xhr.responseText || '';
        const response: SimpleResponse = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          text: () => Promise.resolve(body),
          json: () => {
            try {
              return Promise.resolve(body ? JSON.parse(body) : null);
            } catch (e) {
              return Promise.reject(e);
            }
          },
        };
        resolve(response);
      };

      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.ontimeout = () => reject(new Error('Network timeout'));
      xhr.send(init && init.body ? init.body : null);
    } catch (e) {
      reject(e);
    }
  });

  (window as Window & { fetch?: FetchLike }).fetch = fetchPolyfill;
}
