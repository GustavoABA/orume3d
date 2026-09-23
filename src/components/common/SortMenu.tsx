import type { KeyboardEvent } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

type SortMenuProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  variant?: 'dropdown' | 'list';
  className?: string;
};

const options: { label: string; value: SortOption }[] = [
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A to Z', value: 'name-asc' },
  { label: 'Name: Z to A', value: 'name-desc' },
];

const SortMenuComponent = ({ value, onChange, variant = 'dropdown', className }: SortMenuProps) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(
      0,
      options.findIndex((option) => option.value === value)
    )
  );

  const labelId = useId();
  const listboxId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [value]
  );

  useEffect(() => {
    if (variant !== 'dropdown' || !open) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open, variant]);

  useEffect(() => {
    if (variant !== 'dropdown' || !open) {
      return;
    }
    const selectedIndex = options.findIndex((option) => option.value === value);
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(index);

    const frame = requestAnimationFrame(() => {
      optionRefs.current[index]?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, value, variant]);

  const toggleOpen = () => setOpen((prev) => !prev);

  const handleSelect = (option: SortOption) => {
    onChange(option);
    if (variant === 'dropdown') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => {
        const next =
          event.key === 'ArrowDown'
            ? (prev + 1) % options.length
            : (prev - 1 + options.length) % options.length;
        optionRefs.current[next]?.focus();
        return next;
      });
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        handleSelect(option.value);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  if (variant === 'list') {
    return (
      <div
        className={`w-full rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-slate-100 shadow-inner shadow-black/30 ${className ?? ''}`}
      >
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/20 text-accent">
            <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Sort by</span>
        </div>
        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isSelected
                    ? 'border-accent/60 bg-accent/20 text-accent'
                    : 'border-white/10 bg-white/0 text-slate-200 hover:border-accent/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                <CheckIcon
                  className={`h-4 w-4 transition ${
                    isSelected ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={triggerRef}
        id={labelId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className="group flex h-11 items-center gap-3 rounded-2xl border border-white/15 bg-slate-900 px-4 pr-12 text-sm font-semibold text-slate-100 shadow-lg shadow-black/40 transition hover:border-accent/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-accent"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent transition group-hover:bg-accent/25">
          <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[0.625rem] uppercase tracking-[0.3em] text-slate-400">
            Sort by
          </span>
          <span>{selectedOption.label}</span>
        </div>
        <ChevronDownIcon
          className={`absolute right-4 h-4 w-4 transition-transform ${
            open ? 'rotate-180 text-accent' : 'text-slate-500 group-hover:text-accent'
          }`}
          aria-hidden="true"
        />
      </button>

      <ul
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        className={`absolute left-0 right-0 z-20 mt-3 origin-top rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-black/50 transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <li key={option.value} role="presentation">
              <button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  isSelected
                    ? 'bg-accent/20 text-accent'
                    : 'text-slate-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                <CheckIcon
                  className={`h-4 w-4 transition ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SortMenu = memo(SortMenuComponent);

export default SortMenu;
