import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../components/shop/ProductCard';
import ProductModal from '../components/shop/ProductModal';
import { products as catalog, type Product } from '../data/products';
import { usePreferences } from '../context/PreferencesContext';

type WishlistProps = {
  onCartOpen: () => void;
};

const Wishlist = ({ onCartOpen }: WishlistProps) => {
  const { wishlist, addRecentlyViewed } = usePreferences();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const savedProducts = useMemo(
    () => catalog.filter((product) => wishlist.includes(product.id)),
    [wishlist]
  );

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    addRecentlyViewed(product.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-12 space-y-3"
      >
        <h2 className="text-3xl font-semibold text-white">Your saved favorites</h2>
        <p className="text-sm text-slate-400">
          Keep track of pieces you love and revisit them any time. Items remain synced across your devices.
        </p>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {savedProducts.length} saved {savedProducts.length === 1 ? 'item' : 'items'}
        </span>
      </motion.section>

      {savedProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-surface/80 p-10 text-center text-sm text-slate-400"
        >
          You haven&rsquo;t added anything yet. Tap the heart icon on a product to save it for later.
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onView={handleViewProduct} />
          ))}
        </motion.div>
      )}

      <ProductModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onCartOpen={onCartOpen}
      />
    </div>
  );
};

export default Wishlist;

