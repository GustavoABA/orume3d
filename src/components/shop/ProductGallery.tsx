import { useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProductImage, { PRODUCT_PLACEHOLDER } from './ProductImage';

type ProductGalleryProps = { name: string; image: string; images?: string[] };

export default function ProductGallery({ name, image, images = [] }: ProductGalleryProps) {
  const photos = Array.from(new Set([image, ...images].map(url => url.trim()).filter(Boolean)));
  if (!photos.length) photos.push(PRODUCT_PLACEHOLDER);
  const [selected, setSelected] = useState(0);
  const current = Math.min(selected, photos.length - 1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const move = (offset: number) => setSelected((current + offset + photos.length) % photos.length);

  return (
    <section aria-label={`Fotos de ${name}`} className="min-w-0 p-4 sm:p-6">
      <div
        className="relative aspect-square md:aspect-auto md:h-[min(48vh,440px)] overflow-hidden rounded-2xl border border-paper/10 bg-black/20 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        tabIndex={photos.length > 1 ? 0 : undefined}
        aria-label="Galeria de imagens. Use as setas para navegar."
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            move(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
        onTouchStart={event => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={event => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || photos.length < 2) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        }}
      >
        <ProductImage key={photos[current]} src={photos[current]} alt={`${name} — foto ${current + 1} de ${photos.length}`} loading="eager" className="p-3 sm:p-5" />
        {photos.length > 1 && <>
          <button type="button" onClick={() => move(-1)} aria-label="Foto anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-paper/15 bg-ink/90 p-2.5 text-paper shadow-lg transition hover:bg-surface2 focus-visible:ring-2 focus-visible:ring-accent">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Próxima foto" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-paper/15 bg-ink/90 p-2.5 text-paper shadow-lg transition hover:bg-surface2 focus-visible:ring-2 focus-visible:ring-accent">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </>}
        <span aria-live="polite" aria-atomic="true" className="absolute bottom-3 right-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold tabular-nums text-paper">{current + 1} / {photos.length}</span>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Escolher foto">
          {photos.map((src, index) => (
            <button key={src} type="button" onClick={() => setSelected(index)} aria-label={`Ver foto ${index + 1} de ${name}`} aria-pressed={current === index} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-black/20 p-1 transition focus-visible:ring-2 focus-visible:ring-accent ${current === index ? 'border-accent opacity-100' : 'border-paper/10 opacity-60 hover:border-paper/40 hover:opacity-100'}`}>
              <ProductImage key={src} src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
