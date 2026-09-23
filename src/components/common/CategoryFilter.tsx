import { memo } from "react";
import { categories } from "../../data/products";

type CategoryFilterProps = {
  value: (typeof categories)[number];
  onChange: (value: (typeof categories)[number]) => void;
};

const CategoryFilterComponent = ({ value, onChange }: CategoryFilterProps) => {
  return (
    <div className="max-w-full">
      <div
        className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-surface/60 px-2 py-2 text-xs text-slate-300 shadow-inner shadow-black/30 md:overflow-visible md:gap-3 md:px-3"
        aria-label="Filter by category"
      >
        {categories.map((category) => {
          const isActive = category === value;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`min-w-max whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-transform transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                isActive
                  ? "bg-accent/90 text-slate-900 shadow-[0_6px_20px_rgba(56,189,248,0.12)] scale-100"
                  : "text-slate-300 hover:bg-white/5 hover:scale-[1.02]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CategoryFilter = memo(CategoryFilterComponent);

export default CategoryFilter;
