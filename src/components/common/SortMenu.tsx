import { CheckIcon, ChevronDownIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { memo, useEffect, useRef, useState } from 'react';

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

type SortMenuProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  variant?: 'dropdown' | 'list';
  className?: string;
};

const options: { label: string; value: SortOption }[] = [
  { label: 'Menor preço', value: 'price-asc' },
  { label: 'Maior preço', value: 'price-desc' },
  { label: 'Nome A–Z', value: 'name-asc' },
  { label: 'Nome Z–A', value: 'name-desc' },
];

const SortMenuComponent = ({ value, onChange, variant = 'dropdown', className }: SortMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  if (variant === 'list') {
    return (
      <div className={`orume-panel rounded-2xl p-4 ${className ?? ''}`}>
        <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.24em] text-accent/65">Ordenar por</p>
        <div className="grid gap-2">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  active
                    ? 'border-accent/45 bg-accent text-ink'
                    : 'border-paper/[0.07] text-muted hover:border-accent/25 hover:text-paper'
                }`}
              >
                {option.label}
                <CheckIcon className={`h-4 w-4 ${active ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 min-w-[190px] items-center gap-3 rounded-full border border-paper/10 bg-surface/90 px-4 text-left text-xs text-paper transition hover:border-accent/30"
      >
        <ListBulletIcon className="h-4 w-4 text-accent/70" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-[0.52rem] font-bold uppercase tracking-[0.2em] text-muted/60">Ordenar</span>
          <span className="font-semibold">{selected.label}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="listbox"
        className={`absolute right-0 z-30 mt-2 w-full min-w-[205px] origin-top-right rounded-2xl border border-paper/10 bg-surface p-2 shadow-2xl shadow-black/60 transition ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                active ? 'bg-accent text-ink' : 'text-muted hover:bg-paper/[0.05] hover:text-paper'
              }`}
            >
              {option.label}
              <CheckIcon className={`h-4 w-4 ${active ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(SortMenuComponent);
