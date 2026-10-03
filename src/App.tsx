import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/shop/CartDrawer';
import QuoteModal from './components/quote/QuoteModal';
import BackToTopButton from './components/common/BackToTopButton';
import { ToastViewport } from './context/ToastContext';

const Home = lazy(() => import('./pages/Home'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Admin = lazy(() => import('./pages/Admin'));
const Checkout = lazy(() => import('./pages/Checkout'));

const App = () => {
  const rawPathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const pathname = rawPathname.replace(/^\/orume3d(?=\/|$)/, '') || '/';
  const isAdminRoute = pathname === '/admin';
  const isCheckoutRoute = pathname === '/checkout';
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'wishlist'>('home');

  useEffect(() => {
    if (rawPathname.startsWith('/orume3d')) {
      const target = pathname + window.location.search + window.location.hash;
      window.history.replaceState({}, '', target || '/');
    }
  }, [pathname, rawPathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleCartOpen = () => setIsCartOpen(true);
  const pageView = useMemo(() => activePage, [activePage]);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background p-10 text-center text-stone-500">CARREGANDO ADMIN ORUME…</div>}>
        <Admin />
      </Suspense>
    );
  }

  if (isCheckoutRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background p-10 text-center text-stone-500">CARREGANDO CHECKOUT ORUME…</div>}>
        <Checkout />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-stone-100">
      <div className="relative z-10">
        <Header
          onCartToggle={handleCartOpen}
          onQuoteOpen={() => setIsQuoteOpen(true)}
          onNavigate={setActivePage}
          activePage={pageView}
        />

        <main className="flex-1">
          <Suspense
            fallback={
              <div className="mx-auto max-w-6xl px-6 py-24 text-center text-sm tracking-[0.18em] text-stone-500">
                PREPARANDO CATÁLOGO ORUME...
              </div>
            }
          >
            {pageView === 'home' ? (
              <Home onCartOpen={handleCartOpen} onQuoteOpen={() => setIsQuoteOpen(true)} />
            ) : (
              <Wishlist onCartOpen={handleCartOpen} />
            )}
          </Suspense>
        </main>

        <Footer />
        <BackToTopButton />
        <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <QuoteModal open={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
        <ToastViewport />
      </div>
    </div>
  );
};

export default App;
