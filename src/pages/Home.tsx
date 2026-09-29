import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "../components/common/SearchBar";
import CategoryFilter from "../components/common/CategoryFilter";
import SortMenu, { type SortOption } from "../components/common/SortMenu";
import ProductGrid from "../components/shop/ProductGrid";
import ProductModal from "../components/shop/ProductModal";
import RecentlyViewed from "../components/shop/RecentlyViewed";
import InstagramProjects from "../components/social/InstagramProjects";
import { type Product, type ProductCategory } from "../data/products";
import { usePagination } from "../hooks/usePagination";
import { usePreferences } from "../context/PreferencesContext";
import FilterModal from "../components/common/FilterModal";
import { useCatalog } from "../hooks/useCatalog";

const PAGE_SIZE = 9;

type HomeProps = {
  onCartOpen: () => void;
};

const Home = ({ onCartOpen }: HomeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { addRecentlyViewed, recentlyViewed } = usePreferences();
  const hero = "/orume3d/brand/orume-hero.webp";

  const { products: activeCatalog, loading: catalogLoading, error: catalogError } = useCatalog();

  const categoryOptions = useMemo(
    () => ["All", ...Array.from(new Set(activeCatalog.map((product) => product.category).filter(Boolean)))],
    [activeCatalog]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return activeCatalog.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCatalog, searchTerm, selectedCategory]);

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
    const timeout = window.setTimeout(() => setIsLoading(false), 220);
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
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="orume-panel relative overflow-hidden rounded-[1.7rem]"
        >
          <div className="pointer-events-none absolute inset-0 orume-dot-grid opacity-[0.16]" />
          <div className="grid min-h-[500px] lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-12 sm:px-11 lg:px-14 lg:py-16">
              <p className="orume-eyebrow">Orume 3D • design & impressão</p>

              <h1 className="orume-heading mt-4 max-w-2xl text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
                Ideias ganham
                <span className="block text-accent">forma.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-muted sm:text-base">
                Peças funcionais, objetos com personalidade e projetos personalizados produzidos
                em impressão 3D.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={scrollToCatalog} className="orume-primary">
                  Ver produtos
                </button>
                <a
                  href="https://wa.me/5519989342212?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20projeto%20personalizado%20com%20a%20Orume%203D."
                  target="_blank"
                  rel="noreferrer"
                  className="orume-secondary"
                >
                  Projeto personalizado
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                <span className="orume-chip">Catálogo</span>
                <span className="orume-chip">Personalização</span>
                <span className="orume-chip">Orçamento direto</span>
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden border-t border-paper/[0.06] lg:min-h-full lg:border-l lg:border-t-0">
              <motion.img
                src={hero}
                alt="Peças e identidade visual da Orume 3D"
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 1.035 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/75 via-background/15 to-transparent lg:from-background/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-paper/10 bg-background/75 p-4 backdrop-blur-md sm:left-8 sm:right-auto sm:max-w-xs">
                <span className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-gold">
                  Feito camada por camada
                </span>
                <p className="mt-2 text-sm leading-5 text-paper/80">
                  Do catálogo à peça personalizada, a Orume transforma uma ideia em objeto.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div id="catalogo" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-10 sm:px-8 sm:py-14">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <p className="orume-eyebrow">Catálogo Orume</p>
            <h2 className="orume-heading mt-2 text-3xl sm:text-4xl">
              Encontre sua próxima peça.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Pesquise, filtre, salve favoritos e abra cada produto para ver os detalhes.
            </p>
          </div>

          <span className="w-fit rounded-full border border-paper/10 bg-paper/[0.03] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-muted">
            {sortedProducts.length} {sortedProducts.length === 1 ? "item" : "itens"}
          </span>
        </motion.section>

        <div className="md:hidden">
          <SearchBar value={searchTerm} onChange={setSearchTerm} className="max-w-none" />
        </div>

        <div className="hidden md:block">
          <div className="sticky top-[72px] z-20 -mx-8 border-y border-paper/[0.06] bg-background/92 px-8 py-4 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <SearchBar value={searchTerm} onChange={setSearchTerm} className="w-full" />
                </div>
                <SortMenu value={sortOption} onChange={setSortOption} />
              </div>

              <div className="mt-3">
                <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} />
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
          className="fixed bottom-6 right-5 z-30 inline-flex items-center rounded-full bg-accent px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.11em] text-ink shadow-glow md:hidden"
        >
          Filtrar produtos
        </motion.button>

        {catalogError && !catalogLoading && activeCatalog.length === 0 && (
          <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.05] px-5 py-4 text-sm text-muted">
            O catálogo está temporariamente indisponível. Tente atualizar a página em alguns instantes.
          </div>
        )}

        <div className="mt-8">
          <ProductGrid
            products={paginatedProducts}
            isLoading={catalogLoading || isLoading}
            onView={handleViewProduct}
            onLoadMore={loadMore}
            hasMore={hasMore}
            skeletonCount={PAGE_SIZE}
          />
        </div>

        <RecentlyViewed
          allProducts={activeCatalog}
          productIds={recentlyViewed}
          onSelect={handleViewProduct}
        />

        <InstagramProjects />

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
          categories={categoryOptions}
        />
      </div>
    </>
  );
};

export default Home;
