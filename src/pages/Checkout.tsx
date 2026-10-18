import { buildWhatsAppUrl } from '../lib/whatsapp';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAffiliate } from '../context/AffiliateContext';
import { useCart } from '../context/CartContext';
import { formatBRL } from '../lib/format';
import { loadBackendConfig, postBackend } from '../lib/backend';

const CONTACT_STORAGE_KEY = 'orume-customer-contact';

type CheckoutResponse = {
  ok: boolean;
  error?: string;
  checkoutId?: string;
  orderId?: string;
  message?: string;
  total?: number;
};

const readStoredContact = () => {
  try {
    const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return { name: '', phone: '' };
    const parsed = JSON.parse(raw) as { name?: string; phone?: string };
    return {
      name: String(parsed.name || ''),
      phone: String(parsed.phone || ''),
    };
  } catch {
    return { name: '', phone: '' };
  }
};

const Checkout = () => {
  const affiliate = useAffiliate();
  const { items, subtotal, totalItems, resetCart } = useCart();
  const pendingCheckout = useRef({ signature: '', id: '' });
  const storedContact = useMemo(readStoredContact, []);
  const [name, setName] = useState(storedContact.name);
  const [phone, setPhone] = useState(storedContact.phone);
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
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

  const makeCheckoutId = () =>
    'CHK-' +
    Date.now().toString(36).toUpperCase() +
    '-' +
    Math.random().toString(36).slice(2, 7).toUpperCase();

  const saveContact = (nextName: string, nextPhone: string) => {
    try {
      window.localStorage.setItem(
        CONTACT_STORAGE_KEY,
        JSON.stringify({ name: nextName, phone: nextPhone })
      );
    } catch {
      // O pedido continua funcionando mesmo quando o armazenamento local está indisponível.
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!items.length) {
      setError('Seu carrinho está vazio.');
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');

    if (!cleanName) {
      setError('Informe seu nome.');
      return;
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }

    const signature = JSON.stringify({ cleanName, cleanPhone, cartLines, affiliate, subtotal });
    if (pendingCheckout.current.signature !== signature) {
      pendingCheckout.current = { signature, id: makeCheckoutId() };
    }
    const checkoutId = pendingCheckout.current.id;

    setSubmitting(true);
    try {
      const config = await loadBackendConfig();
      const result = await postBackend<CheckoutResponse>(config.endpoint, {
        action: 'createCheckout',
        affiliateCode: affiliate?.code || '',
        affiliateRate: affiliate?.rate,
        checkoutId,
        name: cleanName,
        phone: cleanPhone,
        cart: cartLines,
        subtotal,
      });

      if (result.checkoutId !== checkoutId) {
        throw new Error('O backend não confirmou o código deste pedido.');
      }

      saveContact(cleanName, cleanPhone);
      pendingCheckout.current = { signature: '', id: '' };
      setSuccessOrderId(result.orderId || checkoutId);
      resetCart();
    } catch (reason) {
      console.error(reason);
      const message =
        reason && typeof reason === 'object' && 'message' in reason
          ? String((reason as { message?: unknown }).message || '')
          : '';
      setError(message || 'Não foi possível registrar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrderId) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-paper">
        <div className="orume-grid pointer-events-none absolute inset-0 opacity-60" />
        <section className="orume-panel relative w-full max-w-xl rounded-[1.8rem] p-8 text-center sm:p-10">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-accentLight" />
          <p className="mt-5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-accent/70">
            Pedido recebido
          </p>
          <h1 className="mt-2 font-display text-3xl text-paper">Pedido registrado com sucesso.</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Seu pedido é <strong className="text-accentLight">#{successOrderId}</strong>. A Orume vai
            entrar em contato pelo WhatsApp informado para confirmar os detalhes, prazo, frete e pagamento.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted/70">
            Seu nome e WhatsApp ficaram salvos neste navegador para facilitar os próximos pedidos.
          </p>
          <a href={buildWhatsAppUrl(`Olá, fiz o pedido #${successOrderId} no site da orume e gostaria de combinar os detalhes.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-ink">Continuar no WhatsApp</a>
          <a
            href="/"
            className="mt-4 inline-flex rounded-full border border-paper/20 px-6 py-3 text-sm font-bold text-paper transition hover:border-accent"
          >
            Voltar para a loja
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-paper">
      <div className="orume-grid pointer-events-none fixed inset-0 opacity-55" />

      <header className="relative z-10 border-b border-accent/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href={buildWhatsAppUrl(`Olá, fiz o pedido #${successOrderId} no site da orume e gostaria de combinar os detalhes.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-ink">Continuar no WhatsApp</a>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted hover:text-accentLight"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar à loja
          </a>
          <span className="orume-metal-text font-display text-xl tracking-[0.18em]">ORUME</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_400px] lg:py-14">
        <section>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">Fazer pedido</p>
          <h1 className="mt-2 font-display text-4xl text-paper sm:text-5xl">Só precisamos do seu contato.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Informe seu nome e WhatsApp. O pedido entra direto no nosso sistema e a Orume entra em contato para confirmar os detalhes.
          </p>

          {items.length === 0 ? (
            <div className="orume-panel mt-8 rounded-3xl p-7">
              <h2 className="font-display text-2xl text-paper">Seu carrinho está vazio.</h2>
              <p className="mt-3 text-sm text-muted">Adicione pelo menos um produto antes de registrar um pedido.</p>
              <a href="/" className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-bold text-ink">
                Ver produtos
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="orume-panel mt-8 rounded-3xl p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-xs font-semibold text-paper/70">
                  Nome *
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    className="mt-2 w-full rounded-2xl border border-accent/[0.12] bg-surface/[0.85] px-4 py-3 text-sm text-paper outline-none transition placeholder:text-muted/[0.55] focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                    placeholder="Seu nome"
                  />
                </label>
                <label className="text-xs font-semibold text-paper/70">
                  WhatsApp *
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    className="mt-2 w-full rounded-2xl border border-accent/[0.12] bg-surface/[0.85] px-4 py-3 text-sm text-paper outline-none transition placeholder:text-muted/[0.55] focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                    placeholder="DDD + número"
                  />
                </label>
              </div>

              <p className="mt-4 text-xs leading-5 text-muted/65">
                Depois do primeiro pedido, esses dois dados ficam salvos apenas neste navegador para você não precisar preencher novamente.
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-ink shadow-glow transition enabled:hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
              >
                {submitting ? 'Registrando pedido…' : 'Registrar pedido'}
              </button>
            </form>
          )}
        </section>

        <aside className="orume-panel h-fit rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-paper/10 pb-4">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-accent/70">Seu pedido</p>
              <h2 className="mt-1 font-display text-2xl text-paper">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</h2>
            </div>
            <strong className="text-lg text-accentLight">{formatBRL(subtotal)}</strong>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-paper/10 bg-paper/[0.025] p-3">
                <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-paper">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">{item.quantity}x {formatBRL(item.price)}</p>
                </div>
                <span className="text-xs font-semibold text-paper/80">{formatBRL(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-paper/10 pt-4 text-sm">
            <div className="flex justify-between text-muted"><span>Produtos</span><span>{formatBRL(subtotal)}</span></div>
            <div className="mt-2 flex justify-between text-muted"><span>Frete</span><span>A confirmar</span></div>
            <p className="mt-4 text-xs leading-5 text-muted/65">O pagamento não acontece no site. A Orume confirma frete e pagamento no contato.</p>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
