import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "../components/common/SearchBar";
import CategoryFilter from "../components/common/CategoryFilter";
import SortMenu, { type SortOption } from "../components/common/SortMenu";
import ProductGrid from "../components/shop/ProductGrid";
import ProductModal from "../components/shop/ProductModal";
import RecentlyViewed from "../components/shop/RecentlyViewed";
import {
  products as catalog,
  type Product,
  type ProductCategory,
} from "../data/products";
import { usePagination } from "../hooks/usePagination";
import { usePreferences } from "../context/PreferencesContext";
import FilterModal from "../components/common/FilterModal";

const PAGE_SIZE = 9;

type HomeProps = {
  onCartOpen: () => void;
};

const Home = ({ onCartOpen }: HomeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "All"
  >("All");
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { addRecentlyViewed, recentlyViewed } = usePreferences();

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return catalog.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const cloned = [...filteredProducts];
    cloned.sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return cloned;
  }, [filteredProducts, sortOption]);

  const {
    items: paginatedProducts,
    hasMore,
    loadMore,
    reset,
  } = usePagination(sortedProducts, PAGE_SIZE);

  useEffect(() => {
    setIsLoading(true);
    const timeout = window.setTimeout(() => setIsLoading(false), 320);
    reset();
    return () => window.clearTimeout(timeout);
  }, [searchTerm, selectedCategory, sortOption, reset]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsFilterModalOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    addRecentlyViewed(product.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12 space-y-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold text-white">
              Discover your next essential
            </h2>
            <p className="text-sm text-slate-400">
              Shop from a curated selection of tech, travel, and lifestyle
              pieces designed to elevate your every day.
            </p>
          </div>
          <div className="md:hidden">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              className="max-w-none"
            />
          </div>
        </div>
        <div className="md:hidden">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {sortedProducts.length} curated items
          </span>
        </div>
      </motion.section>

      <div className="hidden md:block">
        <div className="sticky top-[72px] z-10 -mx-6 bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-5">
            {/* Centered search bar row */}
            <div className="mx-auto max-w-2xl">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                className="mx-auto w-full rounded-full shadow-[0_8px_30px_rgba(2,6,23,0.6)] border border-white/8 bg-gradient-to-r from-surface/90 to-white/2 px-4 py-3"
              />
            </div>

            {/* Filters & sort row below the search */}
            <div className="mt-4 -mx-6 border-t border-slate-800">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
                <div className="flex-1 min-w-0">
                  <CategoryFilter
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <SortMenu value={sortOption} onChange={setSortOption} />
                  <span className="hidden md:inline text-xs uppercase tracking-[0.3em] text-slate-500">
                    {sortedProducts.length} items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsFilterModalOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isFilterModalOpen}
        className="md:hidden fixed bottom-24 right-6 z-40 inline-flex items-center gap-3 rounded-full border border-white/10 bg-gradient-to-r from-accent/90 to-sky-400/60 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/30 backdrop-blur transition hover:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        Filter / Sort
      </motion.button>

      <ProductGrid
        products={paginatedProducts}
        isLoading={isLoading}
        onView={handleViewProduct}
        onLoadMore={loadMore}
        hasMore={hasMore}
        skeletonCount={PAGE_SIZE}
      />

      <RecentlyViewed
        allProducts={catalog}
        productIds={recentlyViewed}
        onSelect={handleViewProduct}
      />

      <ProductModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onCartOpen={onCartOpen}
      />

      <FilterModal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />
    </div>
  );
};

export default Home;
