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
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mb-10"
      >
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-accent/70">Sua seleção</p>
        <h1 className="mt-2 font-display text-4xl text-white">
          Favoritos <span className="orume-metal-text">Orume</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
          Salve produtos para comparar ou voltar depois. Os favoritos ficam neste navegador.
        </p>
        <span className="mt-4 block text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-700">
          {savedProducts.length} {savedProducts.length === 1 ? 'item salvo' : 'itens salvos'}
        </span>
      </motion.section>

      {savedProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="orume-panel rounded-3xl p-10 text-center text-sm text-stone-500"
        >
          Você ainda não salvou nenhum produto. Use o coração nos cards para montar sua seleção.
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
