import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { memo, useEffect, useRef } from 'react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const SearchBarComponent = ({ value, onChange, className }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const input = inputRef.current;
        if (!input || input.offsetParent === null) return;
        event.preventDefault();
        input.focus();
        input.select();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <label className={`group relative flex w-full items-center ${className ?? ''}`}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-5 h-5 w-5 text-stone-600 transition group-focus-within:text-accentLight" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar no catálogo..."
        className="w-full rounded-full border border-accent/12 bg-black/45 py-3.5 pl-13 pr-20 text-sm text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] outline-none backdrop-blur transition placeholder:text-stone-700 focus:border-accent/35 focus:ring-2 focus:ring-accent/10"
      />
      <span className="pointer-events-none absolute right-5 hidden text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-stone-700 md:inline">
        Ctrl K
      </span>
    </label>
  );
};

export default memo(SearchBarComponent);
