import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../../data/products';
import { useCart } from '../../context/CartContext';
import WishlistButton from './WishlistButton';
import { useToast } from '../../context/ToastContext';
import { categoryLabel, formatBRL } from '../../lib/format';

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onCartOpen?: () => void;
};

const ProductModal = ({ product, open, onClose, onCartOpen }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  return (
    <AnimatePresence>
      {open && product && (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Dialog.Overlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/82 backdrop-blur-sm"
            />

            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="orume-panel relative w-full max-w-4xl overflow-hidden rounded-[1.7rem]"
            >
              <div className="grid md:grid-cols-[1.08fr_.92fr]">
                <div className="relative min-h-[330px] bg-black md:min-h-[540px]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full border border-accent/25 bg-black/72 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-accentLight backdrop-blur">
                      {categoryLabel(product.category)}
                    </span>
                    <WishlistButton productId={product.id} />
                  </div>
                </div>

                <div className="flex flex-col p-7 sm:p-9">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">
                    Orume seleciona
                  </p>
                  <Dialog.Title className="mt-3 font-display text-3xl leading-tight text-white">
                    {product.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 text-sm leading-6 text-stone-400">
                    {product.description}
                  </Dialog.Description>

                  <div className="mt-7 border-y border-accent/12 py-5">
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-stone-600">
                      Preço
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="orume-metal-text text-3xl font-bold">
                        {formatBRL(product.price)}
                      </span>
                      {product.discount && (
                        <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.62rem] font-bold text-accentLight">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    {product.rating && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-accent/75">
                        <StarIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{product.rating.toFixed(1)} / 5</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2 text-xs leading-5 text-stone-500">
                    <p>Disponibilidade, variações e prazo serão exibidos conforme cada item for cadastrado no catálogo Orume.</p>
                    <p>Itens sob demanda entram em produção após a confirmação do pedido.</p>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        addToCart(product);
                        showToast(`"${product.name}" adicionado ao carrinho`);
                        onCartOpen?.();
                        onClose();
                      }}
                      className="group relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-6 py-3 text-sm font-bold text-black shadow-glow transition hover:brightness-110"
                    >
                      <span className="relative z-10">Adicionar ao carrinho</span>
                      <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/30 blur-sm transition-all duration-700 group-hover:left-[120%]" />
                    </motion.button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-accent/18 bg-white/[0.025] px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-accent/40 hover:text-accentLight"
                    >
                      Continuar vendo
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full border border-accent/18 bg-black/70 p-2 text-stone-400 backdrop-blur transition hover:border-accent/45 hover:text-accentLight"
              >
                <span className="sr-only">Fechar</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
