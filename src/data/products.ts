export type ProductCategory = string;

export type Product = {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description: string;
  rating?: number;
  discount?: number;
  sku?: string;
  stock?: number;
  productionDays?: number;
  shopeeUrl?: string;
  images?: string[];
  originalPrice?: number;
};

// O catálogo real vem do Google Apps Script / planilha Produtos.
// Mantidos apenas por compatibilidade de tipos/componentes.
export const products: Product[] = [];
export const categories = ['All'] as const;
