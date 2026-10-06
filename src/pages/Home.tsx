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
import MobileCatalogFilters from "../components/common/MobileCatalogFilters";
import { useCatalog } from "../hooks/useCatalog";

const PAGE_SIZE = 9;

type HomeProps = {
  onCartOpen: () => void;
  onQuoteOpen: () => void;
};

const Home = ({ onCartOpen, onQuoteOpen }: HomeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addRecentlyViewed, recentlyViewed } = usePreferences();
  const hero = "/brand/orume-workbench.webp";

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

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    addRecentlyViewed(product.id);
  };

  const scrollToCatalog = () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-accentLight">Impressão 3D por encomenda</p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl lg:text-6xl">Peças para usar.<br />Ideias para tirar do papel.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">Escolha uma peça do catálogo ou conte o que quer imprimir. A gente combina os detalhes, o prazo e a entrega com você.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={scrollToCatalog} className="orume-primary">Ver peças</button>
            <button type="button" onClick={onQuoteOpen} className="orume-secondary">Pedir orçamento</button>
          </div>
          <p className="mt-5 text-sm text-muted">Você aprova o orçamento antes da produção.</p>
        </div>
        <figure className="min-w-0">
          <img src={hero} alt="Composição ilustrativa de peças impressas em 3D, filamento e ferramentas sobre uma bancada" fetchPriority="high" width="1536" height="1024" className="aspect-[3/2] w-full rounded-xl object-cover" />
          <figcaption className="mt-2 text-right text-xs text-muted">Impressão 3D em detalhes · imagem ilustrativa</figcaption>
        </figure>
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
              Peças do catálogo.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Veja as fotos, os materiais e o prazo de produção de cada peça.
            </p>
          </div>

          <span className="w-fit rounded-full border border-paper/10 bg-paper/[0.03] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-muted">
            {sortedProducts.length} {sortedProducts.length === 1 ? "item" : "itens"}
          </span>
        </motion.section>

        <div className="md:hidden">
          <SearchBar value={searchTerm} onChange={setSearchTerm} className="max-w-none" />
          <MobileCatalogFilters categories={categoryOptions} category={selectedCategory} onCategoryChange={setSelectedCategory} sort={sortOption} onSortChange={setSortOption} resultCount={sortedProducts.length} />
        </div>

        <div className="hidden md:block">
          <div className="sticky top-[72px] z-20 -mx-8 border-y border-paper/[0.06] bg-background/[0.92] px-8 py-4 backdrop-blur-xl">
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


      </div>
    </>
  );
};

export default Home;
