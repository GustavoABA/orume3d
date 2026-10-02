import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { usePreferences } from '../../context/PreferencesContext';
import { formatBRL } from '../../lib/format';

type HeaderProps = {
  onCartToggle: () => void;
  onQuoteOpen: () => void;
  onNavigate: (page: 'home' | 'wishlist') => void;
  activePage: 'home' | 'wishlist';
};

const Header = ({ onCartToggle, onQuoteOpen, onNavigate, activePage }: HeaderProps) => {
  const { totalItems, total } = useCart();
  const { wishlist } = usePreferences();
  const [isScrolled, setIsScrolled] = useState(false);
  const logo = '/brand/orume-mark.webp';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 14);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] transition ${
      active
        ? 'bg-accent/[0.12] text-accentLight'
        : 'text-muted hover:bg-paper/[0.04] hover:text-paper'
    }`;

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? 'border-paper/10 bg-background/[0.94] shadow-[0_18px_60px_rgba(0,0,0,.38)]'
          : 'border-paper/[0.06] bg-background/[0.82]'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="group flex min-w-0 items-center gap-3 text-left"
          aria-label="Ir para o início da Orume 3D"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/[0.18] bg-surface shadow-glow transition group-hover:border-accent/[0.36]">
            <img src={logo} alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black tracking-[0.18em] text-paper sm:text-xl">
              ORUME
            </span>
            <span className="block truncate text-[0.54rem] font-bold uppercase tracking-[0.24em] text-muted">
              impressão 3D
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          <button type="button" onClick={() => onNavigate('home')} className={navClass(activePage === 'home')}>
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => onNavigate('wishlist')}
            className={`${navClass(activePage === 'wishlist')} inline-flex items-center gap-2`}
          >
            <HeartIcon className="h-4 w-4" aria-hidden="true" />
            Favoritos
            {wishlist.length > 0 && (
              <span className="rounded-full bg-paper/10 px-1.5 py-0.5 text-[0.58rem] text-paper">
                {wishlist.length}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onQuoteOpen}
            className="hidden rounded-full border border-accent/[0.35] bg-accent/[0.06] px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accentLight transition hover:border-accent/[0.65] hover:bg-accent/10 sm:inline-flex"
          >
            Orçamento
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onCartToggle}
            className="relative inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.1em] text-ink shadow-glow transition hover:brightness-110 sm:px-5"
          >
            <ShoppingBagIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{formatBRL(total)}</span>
            <span className="sm:hidden">Carrinho</span>
            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.62rem] text-accent">
                {totalItems}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-paper/[0.05] md:hidden">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] ${
            activePage === 'home' ? 'text-accent' : 'text-muted'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => onNavigate('wishlist')}
          className={`py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] ${
            activePage === 'wishlist' ? 'text-accent' : 'text-muted'
          }`}
        >
          Favoritos {wishlist.length ? `(${wishlist.length})` : ''}
        </button>
        <button
          type="button"
          onClick={onQuoteOpen}
          className="py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-accent"
        >
          Orçamento
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
