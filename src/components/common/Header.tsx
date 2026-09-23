import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import { formatBRL } from '../../lib/format';

type HeaderProps = {
  onCartToggle: () => void;
  onNavigate: (page: 'home' | 'wishlist') => void;
  activePage: 'home' | 'wishlist';
};

const Header = ({ onCartToggle, onNavigate, activePage }: HeaderProps) => {
  const { totalItems, total } = useCart();
  const { wishlist } = usePreferences();
  const [isScrolled, setIsScrolled] = useState(false);
  const logo = '/orume3d/brand/orume-mark.webp';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-500 ${
        isScrolled
          ? 'border-accent/20 bg-black/88 shadow-[0_18px_60px_rgba(0,0,0,.55)]'
          : 'border-accent/10 bg-black/72'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <motion.button
          type="button"
          onClick={() => onNavigate('home')}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="group flex min-w-0 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-accent/20 bg-[#090806] shadow-gold-soft">
            <span className="absolute inset-0 bg-accent/5 opacity-0 transition group-hover:opacity-100" />
            <img src={logo} alt="" className="relative h-8 w-8 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="orume-metal-text block font-display text-xl font-semibold tracking-[0.18em] sm:text-2xl">
              ORUME
            </span>
            <span className="block truncate text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
              3D • design & impressão
            </span>
          </span>
        </motion.button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activePage === 'home'
                ? 'bg-accent/12 text-accentLight'
                : 'text-stone-400 hover:bg-white/[0.035] hover:text-stone-100'
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => onNavigate('wishlist')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activePage === 'wishlist'
                ? 'bg-accent/12 text-accentLight'
                : 'text-stone-400 hover:bg-white/[0.035] hover:text-stone-100'
            }`}
          >
            <HeartIcon className="h-4 w-4" aria-hidden="true" />
            Favoritos
            {wishlist.length > 0 && (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.6rem] text-accentLight">
                {wishlist.length}
              </span>
            )}
          </button>
        </nav>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCartToggle}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-accent/30 bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-4 py-2.5 text-xs font-bold text-black shadow-glow transition hover:brightness-110 sm:px-5"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/30 blur-sm transition-all duration-700 group-hover:left-[120%]" />
          <ShoppingBagIcon className="relative h-4 w-4" aria-hidden="true" />
          <span className="relative hidden sm:inline">{formatBRL(total)}</span>
          <span className="relative sm:hidden">Carrinho</span>
          {totalItems > 0 && (
            <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[0.65rem] text-accentLight">
              {totalItems}
            </span>
          )}
        </motion.button>
      </div>

      <div className="flex border-t border-white/[0.04] md:hidden">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex-1 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
            activePage === 'home' ? 'text-accentLight' : 'text-stone-500'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => onNavigate('wishlist')}
          className={`flex-1 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
            activePage === 'wishlist' ? 'text-accentLight' : 'text-stone-500'
          }`}
        >
          Favoritos {wishlist.length ? `(${wishlist.length})` : ''}
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
