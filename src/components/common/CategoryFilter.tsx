import { memo } from 'react';
import { categoryLabel } from '../../lib/format';

type CategoryFilterProps = {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
};

const CategoryFilterComponent = ({ value, onChange, options }: CategoryFilterProps) => {
  const categories = options && options.length ? options : ['All'];

  return (
    <div className="max-w-full">
      <div
        className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-paper/10 bg-surface/80 p-1.5 text-xs backdrop-blur md:overflow-visible"
        aria-label="Filtrar por categoria"
      >
        {categories.map((category) => {
          const isActive = category === value;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={'min-w-max whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
                (isActive
                  ? 'bg-accent text-ink shadow-[0_8px_24px_rgba(36,221,117,.12)]'
                  : 'text-muted hover:bg-paper/[0.05] hover:text-paper')}
            >
              {categoryLabel(category)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryFilterComponent);
