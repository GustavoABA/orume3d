import { useState } from 'react';

export const PRODUCT_PLACEHOLDER = '/brand/orume-mark.webp';

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
};

// O chamador usa key={src} para reiniciar o fallback ao trocar a foto.
export default function ProductImage({ src, alt, className = '', loading = 'lazy' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? PRODUCT_PLACEHOLDER : src}
      alt={failed ? `${alt} — imagem indisponível` : alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
