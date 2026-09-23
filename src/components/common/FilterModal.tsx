import { Dialog } from '@headlessui/react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import type { SortOption } from './SortMenu';
import SortMenu from './SortMenu';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import type { ProductCategory } from '../../data/products';

type FilterModalProps = {
  open: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category: ProductCategory | 'All';
  onCategoryChange: (value: ProductCategory | 'All') => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
};

const FilterModal = ({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  sortOption,
  onSortChange,
}: FilterModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
          <div className="flex min-h-full items-end justify-center px-4 py-8 sm:items-center">
            <Dialog.Overlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/70"
            />

            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface/90 via-surface/70 to-white/5 shadow-2xl shadow-black/40 backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <FunnelIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <Dialog.Title>Filter &amp; Sort</Dialog.Title>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-black/40 p-2 text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <span className="sr-only">Close filters</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <SearchBar value={searchTerm} onChange={onSearchChange} className="max-w-none" />
                <div className="flex flex-wrap gap-4">
                  <CategoryFilter value={category} onChange={onCategoryChange} />
                </div>
                <div className="flex flex-col gap-4">
                  <SortMenu variant="list" value={sortOption} onChange={onSortChange} className="md:hidden" />
                  <div className="hidden md:block">
                    <SortMenu value={sortOption} onChange={onSortChange} />
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
