import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { jsonp, loadBackendConfig } from '../lib/backend';
import type { Affiliate } from '../lib/affiliate';

const AffiliateContext = createContext<Affiliate | null>(null);
const KEY = 'orume:affiliate';
export const useAffiliate = () => useContext(AffiliateContext);

// O último link vale durante esta sessão. Apenas o código é guardado; a taxa vem do servidor.
export const AffiliateProvider = ({ children }: { children: ReactNode }) => {
  const [code] = useState(() => {
    if (/\/admin\/?$/.test(window.location.pathname)) return '';
    const query = new URLSearchParams(window.location.search);
    try {
      if (query.has('afiliado')) {
        const value = (query.get('afiliado') || '').trim();
        if (value) sessionStorage.setItem(KEY, value); else sessionStorage.removeItem(KEY);
        return value;
      }
      return sessionStorage.getItem(KEY) || '';
    } catch { return query.get('afiliado') || ''; }
  });
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState('');
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const config = await loadBackendConfig();
        const response = await jsonp<{ ok: boolean; affiliate?: Affiliate; error?: string }>(config.endpoint, { action: 'affiliate', code });
        if (!response.ok || !response.affiliate?.active || response.affiliate.code !== code || !Number.isFinite(response.affiliate.rate) || response.affiliate.rate < 0 || response.affiliate.rate > 1000) throw new Error(response.error || 'Este link de afiliado não está disponível.');
        if (!cancelled) setAffiliate(response.affiliate);
      } catch { if (!cancelled) setError('Não foi possível validar este link de afiliado. Tente novamente ou acesse o catálogo sem o link.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [code]);
  if (loading || error) return <main className="min-h-screen bg-ink p-8 text-paper"><div className="mx-auto max-w-xl py-16"><h1 className="text-2xl">{loading ? 'Carregando catálogo…' : 'Link indisponível'}</h1>{error && <><p role="alert" className="my-5">{error}</p><button className="orume-primary" onClick={() => window.location.reload()}>Tentar novamente</button><a className="ml-5 underline" href="/?afiliado=">Ver catálogo direto</a></>}</div></main>;
  return <AffiliateContext.Provider value={affiliate}>{children}</AffiliateContext.Provider>;
};
