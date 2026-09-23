import { memo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import { useToast } from '../../context/ToastContext';
import { categoryLabel, formatBRL } from '../../lib/format';

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
      showToast(`"${product.name}" adicionado ao carrinho`);
    },
    [addToCart, product, showToast]
  );

  return (
    <motion.article
      layout
      whileHover={{ y: -7 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onClick={() => onView(product)}
      className="orume-panel group flex cursor-pointer flex-col overflow-hidden rounded-[1.4rem] p-3.5 transition-colors duration-300 hover:border-accent/38"
    >
      <div className="relative overflow-hidden rounded-[1.05rem] bg-black">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-60 w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.045] group-hover:opacity-100"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
        <div className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-accent/30 transition duration-500 group-hover:opacity-100" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
          <span className="rounded-full border border-accent/20 bg-black/72 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.17em] text-accentLight/90 backdrop-blur">
            {categoryLabel(product.category)}
          </span>
          <div className="flex items-center gap-2">
            {product.discount && (
              <span className="rounded-full border border-accent/25 bg-[#3a260f]/90 px-2.5 py-1 text-[0.6rem] font-bold tracking-wide text-accentLight">
                -{product.discount}%
              </span>
            )}
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
        <div className="space-y-2">
          <h3 className="font-display text-xl font-medium text-stone-100 transition group-hover:text-accentLight">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-5 text-stone-500">{product.description}</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <span className="orume-metal-text text-xl font-bold">{formatBRL(product.price)}</span>
            {product.rating && (
              <div className="mt-1.5 flex items-center gap-1 text-[0.68rem] font-semibold text-accent/75">
                <StarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{product.rating.toFixed(1)} / 5</span>
              </div>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            className="rounded-full border border-accent/28 bg-accent/10 px-4 py-2.5 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-accentLight transition hover:border-accent/55 hover:bg-accent hover:text-black"
          >
            Adicionar
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

export default memo(ProductCardComponent);
