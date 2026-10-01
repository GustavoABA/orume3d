import { useEffect, useState } from 'react';
import type { Product } from '../data/products';
import { jsonp, loadBackendConfig } from '../lib/backend';

type CatalogResponse = {
  ok: boolean;
  products?: Array<Record<string, unknown>>;
  error?: string;
};

type CatalogCache = {
  savedAt: number;
  products: Product[];
};

const CACHE_KEY = 'orume:catalog:v3';
const CACHE_TTL = 5 * 60 * 1000;
const PLACEHOLDER_IMAGE = '/orume3d/brand/orume-mark.webp';

const cleanUrl = (value: unknown) => String(value || '').trim();

const collectImages = (item: Record<string, unknown>) => {
  const fromArray = Array.isArray(item.images)
    ? item.images.map(cleanUrl)
    : typeof item.images === 'string'
      ? String(item.images)
          .split(/[\n,;|]+/)
          .map((value) => value.trim())
      : [];

  const candidates = [
    item.image,
    item.imageMain,
    item.mainImage,
    item.image_main,
    item.detectedImage,
    item.image2,
    item.image3,
    item['Imagem principal'],
    item['Imagem 2'],
    item['Imagem 3'],
    item['Imagem detectada'],
    ...fromArray,
  ]
    .map(cleanUrl)
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

const mapProduct = (item: Record<string, unknown>): Product => {
  const images = collectImages(item);
  const image = images[0] || PLACEHOLDER_IMAGE;
  const shopeeUrl = cleanUrl(item.shopeeUrl || item['URL Shopee']);

  return {
    id: Number(item.id || item['ID Produto'] || 0),
    name: String(item.name || item['Nome'] || '').trim(),
    price: Number(item.price || item['Preço'] || 0),
    category: String(item.category || item['Categoria'] || 'Outros').trim() || 'Outros',
    image,
    description: String(item.description || item['Descrição'] || ''),
    sku: String(item.sku || item['SKU'] || ''),
    stock: Number(item.stock ?? item['Estoque'] ?? 0),
    productionDays: Number(item.productionDays ?? item['Produção (dias)'] ?? 0),
    shopeeUrl,
    source: shopeeUrl ? 'Shopee' : 'Interno',
    images: images.length ? images : [image],
    originalPrice: Number(item.originalPrice || item.salePrice || item['Preço promocional'] || 0),
  };
};

const readCache = (): Product[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogCache;
    if (!Array.isArray(parsed.products)) return [];
    if (Date.now() - Number(parsed.savedAt || 0) > CACHE_TTL) return [];
    return parsed.products;
  } catch {
    return [];
  }
};

export const useCatalog = () => {
  const cached = readCache();
  const [products, setProducts] = useState<Product[]>(cached);
  const [loading, setLoading] = useState(cached.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cached.length) setLoading(true);

      try {
        const config = await loadBackendConfig();
        const result = await jsonp<CatalogResponse>(
          config.endpoint,
          { action: 'catalog' },
          60000
        );

        if (!result.ok || !Array.isArray(result.products)) {
          throw new Error(result.error || 'Catálogo indisponível.');
        }

        const mapped = result.products
          .map(mapProduct)
          .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name);

        if (cancelled) return;

        setProducts(mapped);
        setError('');

        if (mapped.length > 0) {
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ savedAt: Date.now(), products: mapped } satisfies CatalogCache)
            );
          } catch {
            // cache local é apenas otimização
          }
        }
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar catálogo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // o cache inicial é lido apenas na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products, loading, error };
};
