import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';

type HeaderProps = {
  onCartToggle: () => void;
  onNavigate: (page: 'home' | 'wishlist') => void;
  activePage: 'home' | 'wishlist';
};

const Header = ({ onCartToggle, onNavigate, activePage }: HeaderProps) => {
  const { totalItems, total } = useCart();
  const { wishlist } = usePreferences();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`sticky top-0 z-30 border-b backdrop-blur-lg transition-all duration-300 ${
        isScrolled
          ? 'border-accent/25 bg-background/85 shadow-[0_18px_48px_rgba(8,12,24,0.55)]'
          : 'border-white/10 bg-gradient-to-b from-surface/80 via-surface/60 to-surface/40 shadow-none'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-left text-3xl font-semibold tracking-tight text-white transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            ShopLite Store
          </button>
          <p className="text-sm text-slate-400">
            Elevated essentials, thoughtful design, and tech-forward accessories curated for your every day.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('home')}
              aria-pressed={activePage === 'home'}
              className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                activePage === 'home'
                  ? 'bg-accent/90 text-slate-900 shadow-glow'
                  : 'bg-background/60 text-slate-300 hover:border-accent/60 hover:text-accent'
              }`}
            >
              Browse All
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('wishlist')}
              aria-pressed={activePage === 'wishlist'}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                activePage === 'wishlist'
                  ? 'border-rose-400/70 bg-rose-500/20 text-rose-100 shadow-lg shadow-rose-500/20'
                  : 'border-white/10 bg-background/60 text-slate-300 hover:border-rose-400/60 hover:text-rose-200'
              }`}
            >
              <HeartIcon className="h-4 w-4" aria-hidden="true" />
              <span>Wishlist</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-100">
                {wishlist.length}
              </span>
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onCartToggle}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent/90 px-6 py-3 text-sm font-semibold text-slate-900 shadow-glow transition hover:bg-accent"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition group-hover:opacity-100" />
            <ShoppingBagIcon className="relative h-5 w-5" aria-hidden="true" />
            <span className="relative">${total.toFixed(2)}</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-sky-300 text-xs font-semibold text-slate-900 shadow-glow">
                {totalItems}
              </span>
            )}
            <span className="sr-only">View cart</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
