import type { Product } from '../data/products';

export type Affiliate = { code: string; name: string; rate: number; active: boolean };
export const affiliatePrice = (price: number, rate: number) => Math.round((price * (100 + rate) / 100 + Number.EPSILON) * 100) / 100;
export const priceForAffiliate = (product: Product, affiliate: Affiliate | null): Product => ({
  ...product,
  basePrice: product.basePrice ?? product.price,
  price: affiliatePrice(product.basePrice ?? product.price, affiliate?.rate || 0),
  originalPrice: product.originalPrice ? affiliatePrice(product.originalPrice, affiliate?.rate || 0) : undefined,
  affiliateCode: affiliate?.code,
  affiliateRate: affiliate?.rate,
});
