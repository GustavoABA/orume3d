import { productDimensions } from '../../lib/productDimensions';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, TruckIcon, CubeIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import ProductGallery from './ProductGallery';
import { useToast } from '../../context/ToastContext';
import { categoryLabel, formatBRL } from '../../lib/format';
import { buildDirectProductWhatsAppUrl, isMadeToOrder, productAvailabilityLabel } from '../../lib/productWhatsApp';

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onCartOpen?: () => void;
};

const ProductModal = ({ product, open, onClose, onCartOpen }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const madeToOrder = product ? isMadeToOrder(product) : false;

  return (
    <AnimatePresence>
      {open && product && (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
            <Dialog.Overlay as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/90 backdrop-blur-sm" />
            <Dialog.Panel as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.2 }} className="orume-panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl">
              <div className="flex shrink-0 items-center justify-between border-b border-paper/10 px-5 py-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accentLight">Orume • detalhes da peça</span>
                <button type="button" onClick={onClose} aria-label="Fechar produto" className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper focus-visible:ring-2 focus-visible:ring-accent"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <div className="grid md:grid-cols-[1.1fr_1fr]">
                  <div className="min-w-0 bg-ink/30 md:sticky md:top-0 md:self-start">
                    <ProductGallery key={product.id} name={product.name} image={product.image} images={product.images} />
                  </div>
                  <div className="min-w-0 px-5 pb-6 pt-2 sm:px-7 md:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accentLight">{categoryLabel(product.category)}</p>
                      <WishlistButton productId={product.id} />
                    </div>
                    <Dialog.Title className="mt-3 break-words font-display text-2xl leading-tight text-paper sm:text-3xl">{product.name}</Dialog.Title>
                    <Dialog.Description className="mt-3 text-sm text-muted">{productAvailabilityLabel(product)}. Frete calculado à parte.</Dialog.Description>
                    <div className="mt-5 border-y border-paper/10 py-5">
                      {Number(product.originalPrice) > product.price && <p className="text-sm text-muted line-through">{formatBRL(product.originalPrice!)}</p>}
                      <p className="text-3xl font-bold tabular-nums text-accentLight">{formatBRL(product.price)}</p>
                      <p className="mt-1 text-xs text-muted">Valor por unidade • frete não incluído</p>
                    </div>
                    <div className="mt-5 grid gap-3 text-xs leading-5">
                      <div className="flex gap-3 rounded-xl bg-paper/[0.03] p-3">
                        <CubeIcon className="mt-0.5 h-5 w-5 shrink-0 text-accentLight" />
                        <div><p className="font-semibold text-paper">{productAvailabilityLabel(product)}</p><p className="text-muted">{madeToOrder ? (product.productionDays ? `Produção estimada em ${product.productionDays} dias, após confirmação.` : 'Confirme o prazo de produção com a Orume.') : 'Quantidade e envio confirmados no atendimento.'}</p></div>
                      </div>
                      <div className="flex gap-3 rounded-xl bg-paper/[0.03] p-3">
                        <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accentLight" />
                        <div><p className="font-semibold text-paper">Entrega a combinar</p><p className="text-muted">Informe seu CEP para consultar o frete antes do pagamento.</p></div>
                      </div>
                    </div>
                    {productDimensions(product) && <section className="mt-5 rounded-xl border border-paper/10 p-4"><h3 className="text-sm font-semibold text-paper">Medidas da peça</h3><p className="mt-2 text-sm leading-6 text-muted">{productDimensions(product)}</p></section>}
                    {product.description && <details className="mt-5 border-t border-paper/10 pt-4">
                      <summary className="cursor-pointer py-1 text-sm font-semibold text-paper focus-visible:outline-accent">Descrição completa</summary>
                      <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted">{product.description}</p>
                    </details>}
                    {product.sku && <p className="mt-4 text-xs text-muted">Referência: {product.sku}</p>}
                    {product.shopeeUrl && <a href={product.shopeeUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-semibold text-accentLight underline underline-offset-4">Ver anúncio na Shopee ↗</a>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 border-t border-paper/10 bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div><p className="text-sm font-semibold text-paper">{madeToOrder ? 'Feito para você, sob demanda' : 'Sua próxima peça Orume'}</p><p className="mt-0.5 text-xs text-muted">{madeToOrder ? 'Combine produção e entrega pelo WhatsApp.' : 'Adicione ao carrinho e continue seu pedido.'}</p></div>
                <button type="button" onClick={() => {
                  if (madeToOrder) { window.location.href = buildDirectProductWhatsAppUrl(product); return; }
                  addToCart(product);
                  showToast(`"${product.name}" adicionado ao carrinho`);
                  onClose();
                  onCartOpen?.();
                }} className="shrink-0 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-ink transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-paper">{madeToOrder ? 'Comprar pelo WhatsApp' : 'Adicionar ao carrinho'}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
