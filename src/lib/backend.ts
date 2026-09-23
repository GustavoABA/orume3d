export type BackendConfig = {
  endpoint: string;
  sheet?: string;
  spreadsheetId?: string;
  backendVersion?: number;
};

export const loadBackendConfig = async (): Promise<BackendConfig> => {
  const response = await fetch('/orume3d/intake-config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuração do backend indisponível.');
  const config = (await response.json()) as Partial<BackendConfig>;
  const endpoint = String(config.endpoint || '').trim();
  if (!endpoint) throw new Error('Endpoint do backend não configurado.');
  return { ...config, endpoint } as BackendConfig;
};

export const jsonp = <T>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  timeoutMs = 15000
): Promise<T> =>
  new Promise((resolve, reject) => {
    const callback = '__orume_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const host = window as unknown as Record<string, ((data: T) => void) | undefined>;

    let settled = false;

    const cleanup = (keepNoop = false) => {
      window.clearTimeout(timer);
      if (keepNoop) {
        host[callback] = (() => undefined) as (data: T) => void;
        window.setTimeout(() => {
          try {
            delete host[callback];
          } catch {
            host[callback] = undefined;
          }
        }, 60000);
      } else {
        try {
          delete host[callback];
        } catch {
          host[callback] = undefined;
        }
      }
      script.remove();
    };

    host[callback] = (data: T) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Falha ao consultar o backend.'));
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup(true);
      reject(new Error('Tempo de resposta do backend excedido.'));
    }, timeoutMs);

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    search.set('callback', callback);
    search.set('_', String(Date.now()));
    script.src = endpoint + '?' + search.toString();
    script.async = true;
    document.head.appendChild(script);
  });

export const postNoCors = async (
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const body = new FormData();
  body.append('payload', JSON.stringify(payload));
  await fetch(endpoint, {
    method: 'POST',
    body,
    mode: 'no-cors',
    cache: 'no-store',
    redirect: 'follow',
  });
};
