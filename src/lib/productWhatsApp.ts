import type { Product } from '../data/products';
import { formatBRL } from './format';

const ORUME_WHATSAPP = '5519989342212';
const DIRECT_BUY_CODE = 'cod01#445';

export const isMadeToOrder = (product: Product) => Number(product.stock || 0) <= 0;

export const productAvailabilityLabel = (product: Product) =>
  isMadeToOrder(product)
    ? 'Produzido sob demanda'
    : Number(product.stock) === 1
      ? '1 unidade pronta'
      : Number(product.stock) + ' unidades prontas';

export const buildDirectProductWhatsAppUrl = (product: Product) => {
  const image = String(product.image || product.images?.[0] || '').trim();
  const productionDays = Number(product.productionDays || 0);
  const source = product.source || (product.shopeeUrl ? 'Shopee' : 'Interno');

  const message = [
    DIRECT_BUY_CODE,
    '',
    '✨ *ORUME 3D — INTERESSE EM PRODUTO* ✨',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '📦 *' + product.name + '*',
    '🏷️ Origem: *' + (source === 'Interno' ? 'Produto interno Orume' : 'Shopee') + '*',
    product.sku ? '🏷️ SKU: *' + product.sku + '*' : '',
    '💰 Valor do produto: *' + formatBRL(product.price) + '*',
    '🛠️ Disponibilidade: *Produzido sob demanda*',
    productionDays > 0
      ? '⏳ Produção estimada: *' + productionDays + (productionDays === 1 ? ' dia*' : ' dias*')
      : '',
    image ? '🖼️ Imagem: ' + image : '',
    source === 'Shopee' && product.shopeeUrl ? '🛒 Shopee: ' + product.shopeeUrl : '',
    '',
    '🚚 *O frete ainda não está incluído no valor acima.*',
    '',
    'Quero comprar este produto e gostaria de confirmar prazo, frete e receber o PIX para pagamento.',
  ]
    .filter(Boolean)
    .join('\n');

  return 'https://wa.me/' + ORUME_WHATSAPP + '?text=' + encodeURIComponent(message);
};
