import { categoryLabel } from '../../lib/format';
import type { SortOption } from './SortMenu';

type Props = {
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
};

export default function MobileCatalogFilters({ categories, category, onCategoryChange, sort, onSortChange, resultCount }: Props) {
  const selectClass = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-paper/20 bg-surface px-3 py-3 text-base text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40';
  return <section aria-label="Filtros do catálogo" className="mt-4 space-y-4">
    <label className="block text-sm font-semibold text-paper">Categoria
      <select className={selectClass} value={category} onChange={event => onCategoryChange(event.target.value)}>
        {categories.map(option => <option key={option} value={option}>{option === 'All' ? 'Todas as categorias' : categoryLabel(option)}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold text-paper">Ordenar por
      <select className={selectClass} value={sort} onChange={event => onSortChange(event.target.value as SortOption)}>
        <option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option>
        <option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option>
      </select>
    </label>
    <div className="border-b border-paper/10 pb-3">
      <p role="status" aria-live="polite" aria-atomic="true" className="break-words text-sm leading-6 text-muted">
        {category === 'All' ? 'Todas as categorias' : categoryLabel(category)} · {resultCount} {resultCount === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </p>
      {category !== 'All' && <button type="button" onClick={() => onCategoryChange('All')} className="mt-1 min-h-11 text-sm font-semibold text-accentLight underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Ver todas as categorias</button>}
    </div>
  </section>;
}
