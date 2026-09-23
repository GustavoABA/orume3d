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
  const hero = `${import.meta.env.BASE_URL}brand/orume-hero.webp`;

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
    const timeout = window.setTimeout(() => setIsLoading(false), 280);
    reset();
    return () => window.clearTimeout(timeout);
  }, [searchTerm, selectedCategory, sortOption, reset]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsFilterModalOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    addRecentlyViewed(product.id);
  };

  const scrollToCatalog = () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="mx-auto max-w-[1500px] px-4 pt-5 sm:px-6 sm:pt-7">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.992 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="orume-shine relative min-h-[440px] overflow-hidden rounded-[1.6rem] border border-accent/20 bg-black shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:min-h-[510px]"
        >
          <motion.img
            src={hero}
            alt="Estúdio Orume com peças de impressão 3D em acabamento preto e dourado"
            className="absolute inset-0 h-full w-full object-cover object-center"
            initial={{ scale: 1.045 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/52 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-px orume-gold-line opacity-70" />

          <div className="relative flex min-h-[440px] max-w-3xl flex-col justify-end px-7 pb-9 pt-24 sm:min-h-[510px] sm:px-12 sm:pb-12 lg:px-16">
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.65 }}
              className="mb-4 text-[0.66rem] font-bold uppercase tracking-[0.34em] text-accentLight/80"
            >
              Orume 3D • objetos feitos camada por camada
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.72 }}
              className="max-w-3xl font-display text-4xl font-medium leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
            >
              Forma, função e{" "}
              <span className="orume-metal-text">presença.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.65 }}
              className="mt-5 max-w-xl text-sm leading-6 text-stone-300 sm:text-base"
            >
              Catálogo de peças impressas em 3D, objetos autorais e soluções produzidas
              com acabamento pensado para durar e ocupar espaço com identidade.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.65 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <button
                type="button"
                onClick={scrollToCatalog}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black shadow-glow transition hover:brightness-110"
              >
                <span className="relative z-10">Explorar catálogo</span>
                <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/35 blur-sm transition-all duration-700 group-hover:left-[120%]" />
              </button>
              <a
                href="https://wa.me/5519989342212?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20projeto%20personalizado%20com%20a%20Orume%203D."
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-accent/25 bg-black/45 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-stone-200 backdrop-blur transition hover:border-accent/60 hover:text-accentLight"
              >
                Projeto personalizado
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.7 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-stone-500"
            >
              <span>Produção local</span>
              <span className="text-accent/50">◆</span>
              <span>Peças sob demanda</span>
              <span className="text-accent/50">◆</span>
              <span>Impressão 3D</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <div id="catalogo" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-14 sm:px-8 sm:py-16">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.32em] text-accent/75">
              Curadoria Orume
            </p>
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              Catálogo <span className="orume-metal-text">selecionado</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
              Explore a coleção, salve favoritos e monte seu carrinho. O catálogo será
              atualizado conforme novos produtos entrarem em produção.
            </p>
          </div>

          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-stone-600">
            {sortedProducts.length} {sortedProducts.length === 1 ? "item" : "itens"}
          </span>
        </motion.section>

        <div className="md:hidden">
          <SearchBar value={searchTerm} onChange={setSearchTerm} className="max-w-none" />
        </div>

        <div className="hidden md:block">
          <div className="sticky top-[76px] z-20 -mx-8 border-y border-accent/10 bg-background/88 px-8 py-4 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-2xl">
                <SearchBar value={searchTerm} onChange={setSearchTerm} className="w-full" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
                </div>
                <SortMenu value={sortOption} onChange={setSortOption} />
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
          className="fixed bottom-6 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-[#171109]/95 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-accentLight shadow-glow backdrop-blur md:hidden"
        >
          Filtrar / ordenar
        </motion.button>

        <div className="mt-9">
          <ProductGrid
            products={paginatedProducts}
            isLoading={isLoading}
            onView={handleViewProduct}
            onLoadMore={loadMore}
            hasMore={hasMore}
            skeletonCount={PAGE_SIZE}
          />
        </div>

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
    </>
  );
};

export default Home;
