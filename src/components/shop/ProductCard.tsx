import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../data/products';
import WishlistButton from './WishlistButton';
import ProductImage from './ProductImage';
import { categoryLabel, formatBRL } from '../../lib/format';
import { isMadeToOrder, productAvailabilityLabel } from '../../lib/productWhatsApp';

type ProductCardProps = { product: Product; onView: (product: Product) => void };

const ProductCardComponent = ({ product, onView }: ProductCardProps) => {
  const photoCount = new Set([product.image, ...(product.images || [])].filter(Boolean)).size;
  const madeToOrder = isMadeToOrder(product);
  return (
    <motion.article layout whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="orume-panel orume-panel-interactive group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] p-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface2">
        <button type="button" onClick={() => onView(product)} aria-label={`Ver detalhes de ${product.name}`} className="block h-full w-full p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2">
          <ProductImage key={product.image} src={product.image} alt={product.name} className="transition duration-500 group-hover:scale-[1.035]" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="max-w-[75%] truncate rounded-full border border-paper/10 bg-background/85 px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-paper/80 backdrop-blur">{categoryLabel(product.category)}</span>
          <div className="pointer-events-auto"><WishlistButton productId={product.id} size="sm" /></div>
        </div>
        {photoCount > 1 && <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-[0.65rem] text-paper/80">{photoCount} fotos</span>}
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <h3 className="h-12 text-lg font-bold leading-6 tracking-tight text-paper">
          <button type="button" onClick={() => onView(product)} className="line-clamp-2 w-full break-words text-left transition hover:text-accentLight focus-visible:outline-accent">{product.name}</button>
        </h3>
        <p className="mt-2 line-clamp-2 h-10 text-sm leading-5 text-muted">{product.description || 'Conheça os detalhes desta peça Orume.'}</p>
        <p className={`mt-4 text-[0.62rem] font-semibold uppercase tracking-wider ${madeToOrder ? 'text-amber-200' : 'text-emerald-200'}`}>{productAvailabilityLabel(product)}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-paper/10 pt-4">
          <div className="min-w-0 pt-4">
            <p className="text-[0.62rem] text-muted">Valor da peça</p>
            <p className="text-xl font-bold tabular-nums text-paper">{formatBRL(product.price)}</p>
          </div>
          <button type="button" onClick={() => onView(product)} className="shrink-0 rounded-full bg-accent px-4 py-3 text-xs font-bold text-ink transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-paper">Ver detalhes</button>
        </div>
      </div>
    </motion.article>
  );
};

export default memo(ProductCardComponent);
