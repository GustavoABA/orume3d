import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MinusIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';

const CartDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { items, totalItems, subtotal, tax, total, updateQuantity, removeFromCart, resetCart } = useCart();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState({ subtotal: 0, tax: 0, total: 0, isEmpty: true });

  const handleCheckout = () => {
    setOrderSnapshot({
      subtotal,
      tax,
      total,
      isEmpty: items.length === 0,
    });
    setIsConfirmationOpen(true);
  };

  const confirmationTitle = useMemo(() => {
    if (orderSnapshot.isEmpty) {
      return 'Your cart is empty';
    }
    return 'Ready to place your order?';
  }, [orderSnapshot.isEmpty]);

  const confirmationDescription = useMemo(() => {
    if (orderSnapshot.isEmpty) {
      return 'Add a few products you love before heading to checkout.';
    }
    return `You are confirming a total of $${orderSnapshot.total.toFixed(2)} (incl. tax).`;
  }, [orderSnapshot]);

  const handleConfirm = () => {
    if (orderSnapshot.isEmpty) {
      setIsConfirmationOpen(false);
      return;
    }
    resetCart();
    setIsConfirmationOpen(false);
    onClose();
  };

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-8">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-gradient-to-b from-surface/95 via-surface/80 to-surface/60 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white">Shopping Cart</Dialog.Title>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{totalItems} items</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-white/10 bg-black/40 p-2 text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      <span className="sr-only">Close cart</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">Your cart is empty. Start adding your favorite products!</p>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 rounded-2xl border border-white/10 bg-background/70 p-4 shadow-inner shadow-black/20"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                          <div className="flex flex-1 flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                                <p className="text-sm text-accent">${item.price.toFixed(2)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-rose-300"
                                aria-label={`Remove ${item.name}`}
                              >
                                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                                <button
                                  type="button"
                                  className="rounded-full p-1 transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  aria-label={`Decrease quantity of ${item.name}`}
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
                                  className="w-12 appearance-none bg-transparent text-center text-sm font-semibold text-white focus:outline-none"
                                  aria-label={`Quantity for ${item.name}`}
                                />
                                <button
                                  type="button"
                                  className="rounded-full p-1 transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label={`Increase quantity of ${item.name}`}
                                >
                                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                              <span className="text-sm font-semibold text-slate-300">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4 border-t border-white/10 px-6 py-6">
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Estimated Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-semibold text-white">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleCheckout}
                        className="inline-flex w-full items-center justify-center rounded-full bg-accent/90 px-6 py-3 text-sm font-semibold text-slate-900 shadow-glow transition hover:bg-accent"
                      >
                        Checkout Securely
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        Continue Shopping
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

      <Transition.Root show={isConfirmationOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmationOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/90 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur">
                <Dialog.Title className="text-lg font-semibold text-white">{confirmationTitle}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-slate-300">
                  {confirmationDescription}
                </Dialog.Description>

                {!orderSnapshot.isEmpty && (
                  <div className="mt-6 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>${orderSnapshot.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tax (8%)</span>
                      <span>${orderSnapshot.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold text-white">
                      <span>Grand Total</span>
                      <span>${orderSnapshot.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  {!orderSnapshot.isEmpty && (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-accent/90 px-6 py-3 text-sm font-semibold text-slate-900 shadow-glow transition hover:bg-accent sm:flex-none sm:px-8"
                    >
                      Confirm Order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsConfirmationOpen(false)}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {orderSnapshot.isEmpty ? 'Browse Products' : 'Keep Shopping'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default CartDrawer;
