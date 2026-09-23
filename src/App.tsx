import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/shop/CartDrawer';
import QuoteModal from './components/quote/QuoteModal';
import BackToTopButton from './components/common/BackToTopButton';
import { ToastViewport } from './context/ToastContext';

const Home = lazy(() => import('./pages/Home'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

const App = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'wishlist'>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleCartOpen = () => setIsCartOpen(true);
  const pageView = useMemo(() => activePage, [activePage]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-stone-100">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="orume-grid absolute inset-0 opacity-60" />
        <div className="absolute -left-28 top-24 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -right-36 top-[34rem] h-96 w-96 rounded-full bg-bronze/5 blur-3xl" />
      </div>

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
              <Home onCartOpen={handleCartOpen} />
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
