import { HeartIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { usePreferences } from '../../context/PreferencesContext';
import { useToast } from '../../context/ToastContext';

type WishlistButtonProps = {
  productId: number;
  size?: 'sm' | 'md';
};

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

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
        showToast(added ? 'Added to wishlist' : 'Removed from wishlist');
      }}
      whileTap={{ scale: 0.92 }}
      animate={{
        backgroundColor: active ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.45)',
        borderColor: active ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.12)',
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="rounded-full border bg-black/30 p-2 text-white shadow-lg shadow-black/10 transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <MotionHeartIcon
        className={sizeClass[size]}
        aria-hidden="true"
        animate={{
          scale: active ? [1, 1.2, 1.05] : 1,
          color: active ? '#38bdf8' : '#94a3b8',
          opacity: active ? 1 : 0.9,
        }}
        transition={{
          duration: active ? 0.4 : 0.3,
          ease: active ? 'easeOut' : 'easeInOut',
        }}
      />
      <span className="sr-only">{active ? 'Remove from wishlist' : 'Save to wishlist'}</span>
    </motion.button>
  );
};

export default WishlistButton;
