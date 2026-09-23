import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../../data/products';
import ProductCard from './ProductCard';
import SkeletonCard from '../common/SkeletonCard';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onView: (product: Product) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  skeletonCount?: number;
}

const ProductGrid = ({
  products,
  isLoading,
  onView,
  onLoadMore,
  hasMore,
  skeletonCount = 9,
}: ProductGridProps) => {
  return (
    <div className="space-y-12">
      <AnimatePresence mode="sync">
        {isLoading ? (
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: skeletonCount }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-3xl border border-white/10 bg-surface/80 p-10 text-center text-sm text-slate-400"
          >
            No products match your filters. Try a different keyword or category.
          </motion.div>
        ) : (
          <motion.div key="grid" layout className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onView={onView} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && hasMore && (
        <div className="flex justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onLoadMore}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-accent/60 hover:text-accent"
          >
            Load More
            <span aria-hidden="true">→</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
