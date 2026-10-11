import { useEffect, useState } from 'react';
import Admin from './Admin';

const analyticsUrl =
  'https://datastudio.google.com/embed/reporting/b249f370-bf19-431f-8a61-404a17ba5878/page/3Z1AG';

const AdminPortal = () => {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem('orume:adminKey'))
  );

  useEffect(() => {
    const syncAuthentication = () => {
      const nextAuthenticated = Boolean(sessionStorage.getItem('orume:adminKey'));
      setAuthenticated(nextAuthenticated);
      if (!nextAuthenticated) setAnalyticsOpen(false);
    };

    syncAuthentication();
    const timer = window.setInterval(syncAuthentication, 750);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <Admin />

      {authenticated && (
        <>
          <button
            type="button"
            onClick={() => setAnalyticsOpen(true)}
            className="fixed bottom-5 right-5 z-40 rounded-full border border-accent/30 bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink shadow-xl transition hover:brightness-110"
          >
            Analytics
          </button>

          {analyticsOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Analytics do site"
            >
              <div className="flex h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-accent/20 bg-background shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-accent/15 px-4 py-3 sm:px-6">
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-accent/70">
                      Google Analytics
                    </p>
                    <h2 className="font-display text-xl text-paper">Métricas do site Orume</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalyticsOpen(false)}
                    className="rounded-full border border-accent/20 px-4 py-2 text-xs font-bold text-paper/80 transition hover:border-accent/50 hover:text-accentLight"
                  >
                    Fechar
                  </button>
                </div>

                <iframe
                  title="Analytics Orume"
                  src={analyticsUrl}
                  className="min-h-0 w-full flex-1 bg-white"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPortal;
