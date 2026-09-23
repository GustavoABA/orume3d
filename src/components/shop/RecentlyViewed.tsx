import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../data/products';
import { categoryLabel, formatBRL } from '../../lib/format';

interface RecentlyViewedProps {
  allProducts: Product[];
  productIds: number[];
  onSelect: (product: Product) => void;
}

const RecentlyViewedComponent = ({ allProducts, productIds, onSelect }: RecentlyViewedProps) => {
  const items = useMemo(
    () =>
      productIds
        .map((id) => allProducts.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    [allProducts, productIds]
  );

  if (items.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.26em] text-accent/60">Seu histórico</p>
          <h2 className="mt-1 font-display text-2xl text-white">Vistos recentemente</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <motion.button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            whileHover={{ y: -4 }}
            className="overflow-hidden rounded-2xl border border-accent/10 bg-white/[0.018] text-left transition hover:border-accent/30"
          >
            <img src={product.image} alt={product.name} loading="lazy" className="h-36 w-full object-cover opacity-85" />
            <div className="p-4">
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-accent/60">
                {categoryLabel(product.category)}
              </span>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-stone-200">{product.name}</p>
              <span className="mt-2 block text-sm font-bold text-accentLight">{formatBRL(product.price)}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default memo(RecentlyViewedComponent);
