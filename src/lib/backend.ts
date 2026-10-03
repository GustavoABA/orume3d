export type BackendConfig = {
  endpoint: string;
  sheet?: string;
  spreadsheetId?: string;
  backendVersion?: number;
};

export const loadBackendConfig = async (): Promise<BackendConfig> => {
  const response = await fetch('/intake-config.json?v=' + Date.now(), { cache: 'no-store' });
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
      reject(
        new Error(
          'Não foi possível abrir o Apps Script. Confirme a implantação do Web App como “Executar como: Eu” e “Quem pode acessar: Qualquer pessoa”.'
        )
      );
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup(true);
      reject(
        new Error(
          'O Apps Script não respondeu a tempo. Verifique se a implantação está pública e se a URL /exec em intake-config.json é a implantação atual.'
        )
      );
    }, timeoutMs);

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    search.set('callback', callback);
    search.set('_', String(Date.now()));
    script.src = endpoint + '?' + search.toString();
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    document.head.appendChild(script);
  });

export type BackendResponse = {
  ok: boolean;
  error?: string;
  orderId?: string;
  checkoutId?: string;
};

export const postBackend = async <T extends BackendResponse = BackendResponse>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 60000);
  let result: T;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      // text/plain evita o preflight OPTIONS, que o Web App não implementa.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    result = (await response.json()) as T;
    if (!result || typeof result.ok !== 'boolean') throw new Error('Resposta inválida');
  } catch {
    // Uma falha de rede pode ocorrer depois da gravação. Nunca reenviar automaticamente.
    throw new Error('Não foi possível confirmar a gravação. Os dados podem ter sido recebidos; confira antes de reenviar.');
  } finally {
    window.clearTimeout(timer);
  }
  if (!result.ok) throw new Error(result.error || 'O Apps Script recusou a gravação.');
  return result;
};
