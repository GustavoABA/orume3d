import type { Product } from '../data/products';

export const productDimensions = (product: Pick<Product, 'heightCm' | 'widthCm' | 'depthCm'>) =>
  ([['heightCm', 'Altura'], ['widthCm', 'Largura'], ['depthCm', 'Profundidade']] as const)
    .filter(([key]) => Number.isFinite(product[key]) && Number(product[key]) > 0)
    .map(([key, label]) => `${label}: ${Number(product[key]).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} cm`)
    .join(' · ');
