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
        className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-accent/12 bg-black/35 p-1.5 text-xs backdrop-blur md:overflow-visible"
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
                  ? 'bg-accent/14 text-accentLight shadow-[inset_0_0_0_1px_rgba(216,168,78,.22)]'
                  : 'text-stone-500 hover:bg-white/[0.035] hover:text-stone-200')}
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
