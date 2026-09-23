import { Dialog } from '@headlessui/react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProductCategory } from '../../data/products';
import CategoryFilter from './CategoryFilter';
import SearchBar from './SearchBar';
import SortMenu, { type SortOption } from './SortMenu';

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
}: FilterModalProps) => (
  <AnimatePresence>
    {open && (
      <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
        <div className="flex min-h-full items-end justify-center px-3 py-4 sm:items-center">
          <Dialog.Overlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/82 backdrop-blur-sm"
          />
          <Dialog.Panel
            as={motion.div}
            initial={{ opacity: 0, y: 36, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="orume-panel relative w-full max-w-xl rounded-[1.5rem] p-5"
          >
            <div className="flex items-center justify-between border-b border-accent/10 pb-4">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-accent/75" />
                <Dialog.Title className="text-sm font-bold uppercase tracking-[0.2em] text-stone-300">
                  Filtros e ordenação
                </Dialog.Title>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-600 hover:text-accentLight">
                <span className="sr-only">Fechar filtros</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <SearchBar value={searchTerm} onChange={onSearchChange} />
              <CategoryFilter value={category} onChange={onCategoryChange} />
              <SortMenu variant="list" value={sortOption} onChange={onSortChange} />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    )}
  </AnimatePresence>
);

export default FilterModal;
