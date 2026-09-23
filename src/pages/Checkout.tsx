import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeftIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { formatBRL } from '../lib/format';
import { loadBackendConfig, postNoCors } from '../lib/backend';

const ORUME_WHATSAPP = '5519989342212';

const Checkout = () => {
  const { items, subtotal, totalItems, resetCart } = useCart();
  const [cleanService, setCleanService] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState('');
  const [error, setError] = useState('');

  const cartLines = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
      })),
    [items]
  );

  const fieldClass =
    'mt-2 w-full rounded-2xl border border-accent/12 bg-black/45 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-700 focus:border-accent/40 focus:ring-2 focus:ring-accent/10';

  const makeCheckoutId = () =>
    'CHK-' +
    Date.now().toString(36).toUpperCase() +
    '-' +
    Math.random().toString(36).slice(2, 7).toUpperCase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!items.length) {
      setError('Seu carrinho está vazio.');
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();
    const cep = String(data.get('cep') || '').trim();
    const city = String(data.get('city') || '').trim();
    const delivery = String(data.get('delivery') || '').trim();
    const notes = String(data.get('notes') || '').trim();

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }

    if (cep.replace(/\D/g, '').length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.');
      return;
    }

    if (cleanService && !email) {
      setError('Informe um e-mail para usar o atendimento com o mínimo de interação.');
      return;
    }

    const checkoutId = makeCheckoutId();

    setSubmitting(true);

    try {
      const config = await loadBackendConfig();
      await postNoCors(config.endpoint, {
        action: 'createCheckout',
        checkoutId,
        name,
        phone,
        email,
        cep,
        city,
        delivery,
        notes,
        cleanService,
        cart: cartLines,
        subtotal,
        freight: 0,
        total: subtotal,
        paymentMethod: 'PIX manual',
      });

      if (cleanService) {
        setSuccessId(checkoutId);
        resetCart();
        return;
      }

      const itemText = cartLines
        .map((item) => '• ' + item.quantity + 'x ' + item.name + ' — ' + formatBRL(item.total))
        .join('\n');

      const message = [
        'Olá! Quero finalizar meu pedido na Orume 3D.',
        '',
        'Checkout: ' + checkoutId,
        'Nome: ' + name,
        'WhatsApp: ' + phone,
        email ? 'E-mail: ' + email : '',
        '',
        'ITENS DO CARRINHO',
        itemText,
        '',
        'Subtotal dos itens: ' + formatBRL(subtotal),
        '⚠️ O FRETE AINDA NÃO ESTÁ INCLUÍDO NESTE VALOR.',
        '',
        'CEP: ' + cep,
        'Cidade / UF: ' + city,
        'Forma de entrega: ' + (delivery || 'A combinar'),
        notes ? 'Observações: ' + notes : '',
        '',
        'Gostaria de confirmar o frete e receber o PIX para pagamento.',
      ]
        .filter(Boolean)
        .join('\n');

      window.location.href =
        'https://wa.me/' + ORUME_WHATSAPP + '?text=' + encodeURIComponent(message);
    } catch (reason) {
      console.error(reason);
      setError('Não foi possível registrar o checkout. Tente novamente em alguns instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-stone-100">
        <div className="orume-grid pointer-events-none absolute inset-0 opacity-60" />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="orume-panel relative w-full max-w-xl rounded-[1.8rem] p-8 text-center sm:p-10"
        >
          <EnvelopeIcon className="mx-auto h-9 w-9 text-accentLight" />
          <p className="mt-5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-accent/70">
            Atendimento mínimo
          </p>
          <h1 className="mt-2 font-display text-3xl text-white">Pedido registrado.</h1>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Seu código é <strong className="text-accentLight">{successId}</strong>. A Orume recebeu os
            dados do carrinho e o atendimento seguirá por e-mail, somente com as informações
            necessárias para frete, PIX, produção e entrega.
          </p>
          <a
            href="/orume3d/"
            className="mt-7 inline-flex rounded-full border border-accent/22 bg-accent/[0.06] px-6 py-3 text-sm font-semibold text-accentLight hover:border-accent/45"
          >
            Voltar para a loja
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-stone-100">
      <div className="orume-grid pointer-events-none fixed inset-0 opacity-55" />

      <header className="relative z-10 border-b border-accent/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="/orume3d/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500 hover:text-accentLight"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar à loja
          </a>
          <span className="orume-metal-text font-display text-xl tracking-[0.18em]">ORUME</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:py-14">
        <section>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">
            Finalizar pedido
          </p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
            Só precisamos do <span className="orume-metal-text">essencial.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
            O pagamento não acontece no site. A Orume confirma o frete e envia o PIX manualmente
            depois que receber o pedido.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-7">
            <div className="orume-panel rounded-3xl p-5 sm:p-7">
              <h2 className="font-display text-xl text-white">Seus dados</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-stone-400">
                  Nome *
                  <input className={fieldClass} name="name" required autoComplete="name" />
                </label>
                <label className="text-xs font-semibold text-stone-400">
                  WhatsApp *
                  <input
                    className={fieldClass}
                    name="phone"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="DDD + número"
                  />
                </label>
                <label className="text-xs font-semibold text-stone-400 sm:col-span-2">
                  E-mail {cleanService ? '*' : '(opcional)'}
                  <input
                    className={fieldClass}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required={cleanService}
                    placeholder="voce@email.com"
                  />
                </label>
              </div>
            </div>

            <div className="orume-panel rounded-3xl p-5 sm:p-7">
              <h2 className="font-display text-xl text-white">Entrega</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-stone-400">
                  CEP *
                  <input
                    className={fieldClass}
                    name="cep"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    pattern="[0-9]{5}-?[0-9]{3}"
                    placeholder="00000-000"
                  />
                </label>
                <label className="text-xs font-semibold text-stone-400">
                  Cidade / UF *
                  <input className={fieldClass} name="city" required placeholder="Ex.: Leme/SP" />
                </label>
                <label className="text-xs font-semibold text-stone-400 sm:col-span-2">
                  Forma de entrega
                  <select className={fieldClass} name="delivery" defaultValue="A combinar">
                    <option>A combinar</option>
                    <option>Retirada</option>
                    <option>Correios</option>
                    <option>Transportadora</option>
                    <option>Entrega local</option>
                    <option>Outro</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block text-xs font-semibold text-stone-400">
                Observações
                <textarea
                  className={fieldClass + ' min-h-24 resize-y'}
                  name="notes"
                  placeholder="Opcional."
                />
              </label>
            </div>

            <div className="orume-panel rounded-3xl p-5 sm:p-7">
              <button
                type="button"
                onClick={() => setCleanService((value) => !value)}
                className={
                  'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ' +
                  (cleanService
                    ? 'border-accent/35 bg-accent/10'
                    : 'border-accent/10 bg-white/[0.018] hover:border-accent/25')
                }
              >
                <span
                  className={
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ' +
                    (cleanService ? 'border-accent bg-accent text-black' : 'border-stone-700')
                  }
                >
                  {cleanService ? '✓' : ''}
                </span>
                <span>
                  <strong className="block text-sm text-stone-200">
                    Atendimento com o mínimo de interação
                  </strong>
                  <small className="mt-1 block text-xs leading-5 text-stone-600">
                    Não abre WhatsApp. O pedido é enviado para a Orume e o retorno acontece por
                    e-mail, somente com o necessário para frete, PIX, produção e entrega.
                  </small>
                </span>
              </button>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-6 py-4 text-sm font-bold text-black shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10">
                {submitting
                  ? 'Registrando pedido…'
                  : cleanService
                    ? 'Enviar pedido'
                    : 'Finalizar pelo WhatsApp'}
              </span>
              <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/30 blur-sm transition-all duration-700 group-hover:left-[120%]" />
            </button>
          </form>
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="orume-panel rounded-3xl p-5 sm:p-6">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.26em] text-accent/65">
              Seu carrinho
            </p>
            <h2 className="mt-1 font-display text-2xl text-white">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </h2>

            <div className="mt-6 space-y-4">
              {items.length === 0 ? (
                <p className="rounded-2xl border border-accent/10 p-5 text-sm text-stone-600">
                  Seu carrinho está vazio.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b border-accent/8 pb-4 last:border-0">
                    <img src={item.image} alt="" className="h-16 w-16 rounded-xl bg-black object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-stone-200">{item.name}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {item.quantity} × {formatBRL(item.price)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-accentLight">
                      {formatBRL(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-accent/10 pt-5 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Frete</span>
                <span className="font-semibold text-amber-300">não incluído</span>
              </div>
              <div className="flex justify-between border-t border-accent/10 pt-4 text-base font-semibold text-white">
                <span>Total dos itens</span>
                <span className="orume-metal-text">{formatBRL(subtotal)}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-xs leading-5 text-amber-100/70">
                <strong className="text-amber-200">Frete ainda não adicionado.</strong> O valor
                exibido é somente dos produtos. A Orume calcula e confirma o frete antes de enviar
                o PIX.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Checkout;
