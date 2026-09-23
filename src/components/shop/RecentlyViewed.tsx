import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../data/products';

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

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recently Viewed</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Just for you</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <motion.button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            whileHover={{ y: -4 }}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/50 text-left shadow-lg shadow-black/30 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-36 w-full object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 px-4 py-4">
              <span className="text-xs uppercase tracking-[0.2em] text-accent/80">{product.category}</span>
              <p className="text-sm font-medium text-white line-clamp-1">{product.name}</p>
              <span className="text-sm font-semibold text-slate-300">${product.price.toFixed(2)}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

const RecentlyViewed = memo(RecentlyViewedComponent);

export default RecentlyViewed;
