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
      <span className="pointer-events-none absolute left-5 z-10 flex h-5 w-5 items-center justify-center">
        <MagnifyingGlassIcon className="h-5 w-5 text-muted transition group-focus-within:text-accentLight" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar no catálogo..."
        className="w-full rounded-full border border-paper/10 bg-surface/85 py-3.5 pl-14 pr-20 text-sm text-paper shadow-[inset_0_1px_0_rgba(255,255,255,.025)] outline-none backdrop-blur transition placeholder:text-muted/50 focus:border-accent/35 focus:ring-2 focus:ring-accent/10"
      />
      <span className="pointer-events-none absolute right-5 hidden text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-muted/55 md:inline">
        Ctrl K
      </span>
    </label>
  );
};

export default memo(SearchBarComponent);
