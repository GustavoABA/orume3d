import { memo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import { useToast } from '../../context/ToastContext';

type ProductCardProps = {
  product: Product;
  onView: (product: Product) => void;
};

const ProductCardComponent = ({ product, onView }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      addToCart(product);
      showToast(`Added "${product.name}" to cart`);
    },
    [addToCart, product, showToast]
  );

  return (
    <motion.article
      layout
      whileHover={{ y: -6 }}
      onClick={() => onView(product)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface/70 via-surface/50 to-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur transition"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-56 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
        <div className="absolute left-0 top-0 flex w-full items-start justify-between p-4">
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-100">
            {product.category}
          </span>
          <div className="flex items-center gap-2">
            {product.discount && (
              <span className="rounded-full bg-rose-500/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white shadow-lg shadow-rose-500/30">
                Save {product.discount}%
              </span>
            )}
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-400">{product.description}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-2xl font-bold text-accent">${product.price.toFixed(2)}</span>
            {product.rating && (
              <div className="flex items-center gap-1 text-xs font-medium text-amber-300">
                <StarIcon className="h-4 w-4" aria-hidden="true" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/90 px-4 py-2 text-xs font-semibold text-slate-900 shadow-glow transition hover:bg-accent"
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

const ProductCard = memo(ProductCardComponent);

export default ProductCard;
