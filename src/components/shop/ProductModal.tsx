import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import { useToast } from '../../context/ToastContext';

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onCartOpen?: () => void;
};

const ProductModal = ({ product, open, onClose, onCartOpen }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const shouldRender = open && Boolean(product);

  return (
    <AnimatePresence>
      {shouldRender && product && (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Dialog.Overlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/70"
            />

            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface/90 via-surface/70 to-white/5 shadow-2xl shadow-black/40 backdrop-blur"
            >
              <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
                      {product.category}
                    </span>
                    <WishlistButton productId={product.id} />
                  </div>
                </div>
                <div className="flex flex-col gap-6 px-6 pb-8 pt-10">
                  <div className="space-y-2">
                    <Dialog.Title className="text-2xl font-semibold text-white">{product.name}</Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-300">
                      {product.description}
                    </Dialog.Description>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200 shadow-inner shadow-black/20">
                    <div className="space-y-1 text-right">
                      <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">Price</span>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-3xl font-bold text-accent">${product.price.toFixed(2)}</span>
                        {product.discount && (
                          <span className="rounded-full bg-rose-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-rose-500/30">
                            Save {product.discount}%
                          </span>
                        )}
                      </div>
                      {product.rating && (
                        <div className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-300">
                          <StarIcon className="h-4 w-4" aria-hidden="true" />
                          <span>{product.rating.toFixed(1)} rating</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-xs text-slate-400">
                    <p>Free carbon-neutral shipping on orders over $150.</p>
                    <p>30-day hassle-free returns. Quality guaranteed.</p>
                  </div>
                  <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        addToCart(product);
                        showToast(`Added "${product.name}" to cart`);
                        onCartOpen?.();
                        onClose();
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent/90 px-6 py-3 text-sm font-semibold text-slate-900 shadow-glow transition hover:bg-accent"
                    >
                      Add to Cart
                    </motion.button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Keep Browsing
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/40 p-2 text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
