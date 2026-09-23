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
}: ProductGridProps) => (
  <div className="space-y-12">
    <AnimatePresence mode="sync">
      {isLoading ? (
        <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: skeletonCount }, (_, index) => <SkeletonCard key={index} />)}
        </motion.div>
      ) : products.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="orume-panel rounded-3xl p-10 text-center text-sm text-stone-500"
        >
          Nenhum produto corresponde à sua busca. Tente outro termo ou categoria.
        </motion.div>
      ) : (
        <motion.div key="grid" layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
          className="rounded-full border border-accent/18 bg-accent/[0.05] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-accentLight transition hover:border-accent/45 hover:bg-accent/10"
        >
          Carregar mais →
        </motion.button>
      </div>
    )}
  </div>
);

export default ProductGrid;
