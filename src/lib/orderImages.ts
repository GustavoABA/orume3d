export type OrderImageProduct = { name: string; imageMain?: string; detectedImage?: string; image2?: string; image3?: string };
export type OrderImageItem = { name: string; quantity: number; images: string[] };
const key = (name: string) => name.trim().normalize('NFC').toLocaleLowerCase('pt-BR');

// Older orders store item names rather than catalog IDs. Only unique exact names
// are matched so similarly named pieces never borrow each other's photos.
export function orderImageItems(order: { product: string; description: string; quantity: number | string }, products: OrderImageProduct[]): OrderImageItem[] {
  const detailItems = String(order.description || '').split('\n').map(line => line.match(/^(\d+)x (.+) — R\$\s*[\d.,]+\s*$/)).filter((m): m is RegExpMatchArray => Boolean(m));
  const summary = String(order.product || 'Peça não informada');
  const items = detailItems.length ? detailItems.map(m => ({ name: m[2], quantity: Number(m[1]) })) : summary.split(/ \+ (?=\d+x )/).map(part => {
    const match = part.match(/^(\d+)x (.+)$/);
    return { name: match ? match[2] : part, quantity: match ? Number(match[1]) : Number(order.quantity) || 1 };
  });
  return items.map(item => {
    const matches = products.filter(product => key(product.name) === key(item.name));
    const product = matches.length === 1 ? matches[0] : undefined;
    const images = product ? [...new Set([product.imageMain, product.detectedImage, product.image2, product.image3].map(url => String(url || '').trim()).filter(url => /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)))] : [];
    return { ...item, images };
  });
}
