import { HeartIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { usePreferences } from '../../context/PreferencesContext';
import { useToast } from '../../context/ToastContext';

type WishlistButtonProps = {
  productId: number;
  size?: 'sm' | 'md';
};

const sizeClass = { sm: 'h-4 w-4', md: 'h-5 w-5' };
const MotionHeartIcon = motion(HeartIcon);

const WishlistButton = ({ productId, size = 'md' }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = usePreferences();
  const { showToast } = useToast();
  const active = isInWishlist(productId);

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.stopPropagation();
        const added = toggleWishlist(productId);
        showToast(added ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      }}
      whileTap={{ scale: 0.9 }}
      animate={{
        backgroundColor: active ? 'rgba(216,168,78,.16)' : 'rgba(5,5,4,.65)',
        borderColor: active ? 'rgba(216,168,78,.5)' : 'rgba(216,168,78,.14)',
      }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="rounded-full border p-2 shadow-lg shadow-black/20 backdrop-blur transition hover:border-accent/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <MotionHeartIcon
        className={sizeClass[size]}
        aria-hidden="true"
        animate={{
          scale: active ? [1, 1.22, 1.03] : 1,
          color: active ? '#f4d58a' : '#78716c',
        }}
        transition={{ duration: 0.35 }}
      />
      <span className="sr-only">{active ? 'Remover dos favoritos' : 'Salvar nos favoritos'}</span>
    </motion.button>
  );
};

export default WishlistButton;
