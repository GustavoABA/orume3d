import { memo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import { useToast } from '../../context/ToastContext';
import { categoryLabel, formatBRL } from '../../lib/format';
import { buildDirectProductWhatsAppUrl, isMadeToOrder, productAvailabilityLabel } from '../../lib/productWhatsApp';

type ProductCardProps = {
  product: Product;
  onView: (product: Product) => void;
};

const ProductCardComponent = ({ product, onView }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const madeToOrder = isMadeToOrder(product);

  const handleAddToCart = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (madeToOrder) {
        window.location.href = buildDirectProductWhatsAppUrl(product);
        return;
      }

      addToCart(product);
      showToast(`"${product.name}" adicionado ao carrinho`);
    },
    [addToCart, madeToOrder, product, showToast]
  );

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onClick={() => onView(product)}
      className="orume-panel orume-panel-interactive group flex cursor-pointer flex-col overflow-hidden rounded-[1.35rem] p-3"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-surface2">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/brand/orume-mark.webp')) {
              event.currentTarget.src = '/brand/orume-mark.webp';
              event.currentTarget.classList.remove('object-cover');
              event.currentTarget.classList.add('object-contain', 'p-10');
            }
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="rounded-full border border-paper/10 bg-background/80 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-paper/80 backdrop-blur">
            {categoryLabel(product.category)}
          </span>

          <div className="flex items-center gap-2">
            {product.discount && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[0.58rem] font-black text-ink">
                -{product.discount}%
              </span>
            )}
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <h3 className="text-lg font-black leading-tight tracking-[-0.02em] text-paper transition group-hover:text-accentLight">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{product.description}</p>
        <span className={`mt-3 inline-flex w-fit rounded-full border px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] ${
          madeToOrder
            ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-200'
            : 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200'
        }`}>
          {productAvailabilityLabel(product)}
        </span>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <span className="text-xl font-black text-paper">{formatBRL(product.price)}</span>
            {product.rating && (
              <div className="mt-1.5 flex items-center gap-1 text-[0.68rem] font-semibold text-gold">
                <StarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{product.rating.toFixed(1)} / 5</span>
              </div>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            className="rounded-full bg-accent px-4 py-2.5 text-[0.64rem] font-black uppercase tracking-[0.1em] text-ink transition hover:brightness-110"
          >
            {madeToOrder ? 'Comprar' : 'Adicionar'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

export default memo(ProductCardComponent);
