import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { memo, useEffect, useRef } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const SearchBarComponent = ({ value, onChange, className }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value && value.length > 0);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        const input = inputRef.current;
        if (!input || input.offsetParent === null) {
          return;
        }

        event.preventDefault();
        input.focus();
        input.select();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <label
      className={`group relative flex w-full max-w-full items-center${
        className ? ` ${className}` : ""
      }`}
    >
      <MagnifyingGlassIcon className="pointer-events-none absolute left-5 h-6 w-6 text-slate-400 transition group-focus-within:text-accent" />
      <input
        type="search"
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={hasValue ? "" : "Search products..."}
        className="min-w-0 w-full rounded-full border border-white/8  bg-background from-black/10 to-transparent px-14 py-4 pr-20 text-sm text-slate-100 placeholder:text-slate-500 placeholder:opacity-80 shadow-lg shadow-black/40 backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-accent/60 focus:placeholder:text-slate-400 md:pr-32"
      />
      <span
        className={`pointer-events-none absolute right-6 hidden text-xs uppercase tracking-[0.3em] text-slate-500 transition group-focus-within:text-accent ${
          hasValue ? "md:hidden" : "md:inline"
        }`}
      >
        Cmd / Ctrl + K
      </span>
    </label>
  );
};

const SearchBar = memo(SearchBarComponent);

export default SearchBar;
