import type { Product } from '../data/products';
import { jsonp, loadBackendConfig } from './backend';

type CatalogResponse = {
  ok: boolean;
  products?: Array<Record<string, unknown>>;
  error?: string;
};

type CatalogCache = {
  savedAt: number;
  products: Product[];
};

const CACHE_KEY = 'orume:catalog:v6';
const CACHE_TTL = 5 * 60 * 1000;
const PLACEHOLDER_IMAGE = '/brand/orume-mark.webp';

const cleanUrl = (value: unknown) => {
  let url = String(value || '').trim();
  if (!url) return '';

  url = url.replace(/^http:\/\//i, 'https://');
  url = url.replace(/^https:\/\/gustavoaba\.github\.io\/orume3d\//i, 'https://orume.com.br/');
  url = url.replace(/^\/orume3d\//i, '/');

  return url;
};

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
    heightCm: Number(item.heightCm) || undefined,
    widthCm: Number(item.widthCm) || undefined,
    depthCm: Number(item.depthCm) || undefined,
    productionDays: Number(item.productionDays ?? item['Produção (dias)'] ?? 0),
    shopeeUrl,
    source: shopeeUrl ? 'Shopee' : 'Interno',
    images: images.length ? images : [image],
    originalPrice: Number(item.originalPrice || item.salePrice || item['Preço promocional'] || 0),
  };
};

const normalizeCachedProduct = (product: Product): Product => {
  const images = Array.from(
    new Set([product.image, ...(product.images || [])].map(cleanUrl).filter(Boolean))
  );
  const image = images[0] || PLACEHOLDER_IMAGE;
  return {
    ...product,
    image,
    images: images.length ? images : [image],
    shopeeUrl: cleanUrl(product.shopeeUrl),
  };
};

const readCache = (): CatalogCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogCache;
    if (!Number.isFinite(parsed.savedAt) || parsed.savedAt > Date.now() || !Array.isArray(parsed.products)) return null;
    if (Date.now() - Number(parsed.savedAt || 0) > CACHE_TTL) return null;
    return { savedAt: parsed.savedAt, products: parsed.products.map(normalizeCachedProduct) };
  } catch {
    return null;
  }
};

let memory: CatalogCache | null = null;
let pending: Promise<Product[]> | null = null;

export const getCachedCatalog = (): Product[] | null => {
  if (!memory) memory = readCache();
  if (!memory || Date.now() - memory.savedAt > CACHE_TTL) return null;
  return memory.products;
};

export const loadCatalog = (): Promise<Product[]> => {
  const cached = getCachedCatalog();
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = (async () => {
    const config = await loadBackendConfig();
    const result = await jsonp<CatalogResponse>(config.endpoint, { action: 'catalog' }, 60000);
    if (!result.ok || !Array.isArray(result.products)) throw new Error(result.error || 'Catálogo indisponível.');
    const products = result.products.map(mapProduct).filter(item => Number.isInteger(item.id) && item.id > 0 && item.name);
    memory = { savedAt: Date.now(), products };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(memory)); } catch { /* Cache opcional. */ }
    return products;
  })().finally(() => { pending = null; });
  return pending;
};
