import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/shop/CartDrawer';
import BackToTopButton from './components/common/BackToTopButton';
import { ToastViewport } from './context/ToastContext';

const Home = lazy(() => import('./pages/Home'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

const App = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'wishlist'>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const handleCartOpen = () => setIsCartOpen(true);
  const pageView = useMemo(() => activePage, [activePage]);

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Header
        onCartToggle={handleCartOpen}
        onNavigate={setActivePage}
        activePage={pageView}
      />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-6 py-20 text-center text-sm text-slate-400">
              Loading collection...
            </div>
          }
        >
          {pageView === 'home' ? <Home onCartOpen={handleCartOpen} /> : <Wishlist onCartOpen={handleCartOpen} />}
        </Suspense>
      </main>
      <Footer />
      <BackToTopButton />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ToastViewport />
    </div>
  );
};

export default App;
