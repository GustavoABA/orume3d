import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MinusIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { formatBRL } from '../../lib/format';

const CartDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { items, totalItems, subtotal, total, updateQuantity, removeFromCart } = useCart();
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/78 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-7">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-[cubic-bezier(.22,1,.36,1)] duration-400"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-250"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md border-l border-accent/14 bg-[#090806]/98 shadow-2xl shadow-black/70 backdrop-blur-xl">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-accent/12 px-6 py-5">
                      <div>
                        <p className="text-[0.58rem] font-bold uppercase tracking-[0.28em] text-accent/65">
                          Orume 3D
                        </p>
                        <Dialog.Title className="mt-1 font-display text-2xl text-white">
                          Seu carrinho
                        </Dialog.Title>
                        <p className="mt-1 text-xs text-stone-600">
                          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-accent/15 bg-white/[0.025] p-2 text-stone-500 transition hover:border-accent/40 hover:text-accentLight"
                      >
                        <span className="sr-only">Fechar carrinho</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-accent/10 bg-white/[0.02] p-6 text-center">
                          <p className="font-display text-xl text-stone-300">Seu carrinho está vazio.</p>
                          <p className="mt-2 text-sm text-stone-600">Explore o catálogo e adicione os itens que quiser.</p>
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 rounded-2xl border border-accent/10 bg-white/[0.022] p-3.5"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              className="h-20 w-20 rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold text-stone-100">{item.name}</h3>
                                  <p className="mt-1 text-xs font-semibold text-accentLight">{formatBRL(item.price)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="rounded-full p-2 text-stone-600 transition hover:bg-white/[0.04] hover:text-red-300"
                                  aria-label={`Remover ${item.name}`}
                                >
                                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-accent/12 bg-black/35 px-2 py-1 text-stone-300">
                                  <button
                                    type="button"
                                    className="rounded-full p-1 transition hover:text-accentLight"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    aria-label={`Diminuir quantidade de ${item.name}`}
                                  >
                                    <MinusIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={item.quantity}
                                    onChange={(event) => {
                                      const parsed = Number.parseInt(event.target.value, 10);
                                      updateQuantity(item.id, Number.isNaN(parsed) ? 1 : parsed);
                                    }}
                                    className="w-9 appearance-none bg-transparent text-center text-xs font-bold text-white outline-none"
                                    aria-label={`Quantidade de ${item.name}`}
                                  />
                                  <button
                                    type="button"
                                    className="rounded-full p-1 transition hover:text-accentLight"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    aria-label={`Aumentar quantidade de ${item.name}`}
                                  >
                                    <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                                <span className="text-xs font-semibold text-stone-400">
                                  {formatBRL(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-accent/12 px-6 py-6">
                      <div className="space-y-2 text-sm text-stone-500">
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span>{formatBRL(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Frete</span>
                          <span className="text-xs">calculado no checkout</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-accent/10 pt-3 text-base font-semibold text-white">
                          <span>Total dos itens</span>
                          <span className="orume-metal-text">{formatBRL(total)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3">
                        <button
                          type="button"
                          disabled={items.length === 0}
                          onClick={() => setCheckoutNotice(true)}
                          className="w-full rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-6 py-3 text-sm font-bold text-black shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Continuar para checkout
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-accent/14 px-6 py-3 text-sm font-semibold text-stone-400 transition hover:border-accent/35 hover:text-accentLight"
                        >
                          Continuar comprando
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={checkoutNotice} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setCheckoutNotice(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/82 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center px-4">
            <Transition.Child as={Fragment} enter="ease-out duration-250" enterFrom="opacity-0 translate-y-4 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="orume-panel w-full max-w-md rounded-3xl p-7 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-accent/70">Checkout Orume</p>
                <Dialog.Title className="mt-3 font-display text-2xl text-white">Carrinho preservado.</Dialog.Title>
                <Dialog.Description className="mt-3 text-sm leading-6 text-stone-500">
                  A etapa de entrega, frete e pagamento será conectada ao carrinho na próxima implementação. Nenhum pedido foi enviado ou cobrado agora.
                </Dialog.Description>
                <button
                  type="button"
                  onClick={() => setCheckoutNotice(false)}
                  className="mt-6 rounded-full border border-accent/25 bg-accent/10 px-6 py-3 text-sm font-semibold text-accentLight transition hover:bg-accent hover:text-black"
                >
                  Voltar ao carrinho
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default CartDrawer;
