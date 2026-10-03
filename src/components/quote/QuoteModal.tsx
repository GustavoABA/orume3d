import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { loadBackendConfig, postBackend } from '../../lib/backend';

type QuoteModalProps = {
  open: boolean;
  onClose: () => void;
};

const initialQuantity = '1';

const QuoteModal = ({ open, onClose }: QuoteModalProps) => {
  const pendingQuote = useRef({ signature: '', id: '' });
  const formRef = useRef<HTMLFormElement>(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [cleanService, setCleanService] = useState(false);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBackendConfig()
      .then((config) => setEndpoint(config.endpoint))
      .catch(() => setEndpoint(''));
  }, []);

  useEffect(() => {
    if (!open) {
      setStatus('');
      setCleanModalOpen(false);
    }
  }, [open]);

  const makeSiteId = () =>
    `SITE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const resolvedQuantity =
      quantity === 'Outro' ? String(data.get('quantityOther') || '').trim() : quantity;

    if (!resolvedQuantity) {
      setStatus('Informe a quantidade.');
      return;
    }

    const phone = String(data.get('phone') || '').trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length < 10) {
      setStatus('Informe um WhatsApp válido com DDD.');
      form.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }

    const cep = String(data.get('cep') || '').trim();
    const cepDigits = cep.replace(/\D/g, '');

    if (cepDigits.length !== 8) {
      setStatus('Informe um CEP válido com 8 dígitos.');
      form.querySelector<HTMLInputElement>('[name="cep"]')?.focus();
      return;
    }

    if (!endpoint) {
      setStatus('A integração automática está temporariamente indisponível.');
      return;
    }

    const payload = {
      action: 'quote',
      name: String(data.get('name') || '').trim(),
      phone,
      city: String(data.get('city') || '').trim(),
      referral: String(data.get('referral') || '').trim(),
      product: String(data.get('product') || '').trim(),
      quantity: resolvedQuantity,
      dimensions: String(data.get('dimensions') || '').trim(),
      color: String(data.get('color') || '').trim(),
      material: String(data.get('material') || '').trim(),
      deadline: String(data.get('deadline') || '').trim(),
      links: String(data.get('links') || '').trim(),
      description: String(data.get('description') || '').trim(),
      delivery: String(data.get('delivery') || '').trim(),
      cep,
      notes: String(data.get('notes') || '').trim(),
      cleanService,
    };

    const signature = JSON.stringify(payload);
    if (pendingQuote.current.signature !== signature) {
      pendingQuote.current = { signature, id: makeSiteId() };
    }
    const siteId = pendingQuote.current.id;

    setSubmitting(true);
    setStatus('Registrando seu orçamento…');

    try {
      try {
        localStorage.setItem(
          'orume:lastQuotePending',
          JSON.stringify({ siteId, createdAt: new Date().toISOString() })
        );
      } catch {
        // armazenamento local é apenas auxiliar
      }

      const result = await postBackend(endpoint, { ...payload, siteId });
      if (!result.orderId) throw new Error('O backend não confirmou o número do orçamento.');
      pendingQuote.current = { signature: '', id: '' };
      const orderText = result.orderId ? ` Pedido ${result.orderId}.` : '';

      setStatus(
        `Orçamento recebido pela Orume.${orderText} Entraremos em contato pelo WhatsApp informado.`
      );

      try {
        localStorage.removeItem('orume:lastQuotePending');
      } catch {
        // armazenamento local é apenas auxiliar
      }

      form.reset();
      setQuantity(initialQuantity);
      setCleanService(false);
    } catch (error) {
      console.error('Falha no orçamento:', error);
      setStatus(
        error instanceof Error ? error.message : 'Não foi possível confirmar o orçamento.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'mt-2 w-full rounded-2xl border border-accent/[0.12] bg-surface/[0.85] px-4 py-3 text-sm text-paper outline-none transition placeholder:text-muted/[0.55] focus:border-accent/40 focus:ring-2 focus:ring-accent/10';

  return (
    <>
      <AnimatePresence>
        {open && (
          <Dialog open={open} onClose={submitting ? () => undefined : onClose} className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-start justify-center px-3 py-4 sm:px-6 sm:py-8">
              <Dialog.Overlay
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-ink/90 backdrop-blur-md"
              />

              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, y: 28, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="orume-panel relative w-full max-w-6xl overflow-hidden rounded-[1.8rem]"
              >
                <div className="border-b border-accent/10 px-6 py-6 sm:px-8">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">
                    Orçamento Orume
                  </p>
                  <Dialog.Title className="mt-2 font-display text-3xl text-paper sm:text-4xl">
                    Conte o que você precisa.
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                    Preencha apenas o necessário. O pedido é registrado automaticamente para a Orume e o contato acontece pelo WhatsApp informado.
                  </Dialog.Description>
                </div>

                <div className="grid lg:grid-cols-[1fr_300px]">
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
                    <section>
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-accent/[0.65]">
                        01 — Contato
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-paper/70">
                          Nome *
                          <input className={fieldClass} name="name" required autoComplete="name" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Seu WhatsApp *
                          <input className={fieldClass} name="phone" required inputMode="tel" autoComplete="tel" placeholder="DDD + número" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Cidade / UF *
                          <input className={fieldClass} name="city" required placeholder="Ex.: Leme/SP" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Indicado por
                          <input className={fieldClass} name="referral" placeholder="Parceiro, criador ou amigo" />
                        </label>
                      </div>
                    </section>

                    <section className="border-t border-accent/10 pt-7">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-accent/[0.65]">
                        02 — Peça / produto
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-paper/70">
                          O que deseja imprimir? *
                          <input className={fieldClass} name="product" required placeholder="Ex.: suporte personalizado" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Quantidade *
                          <select
                            className={fieldClass}
                            name="quantity"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            required
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="Outro">Outros</option>
                          </select>
                        </label>

                        {quantity === 'Outro' && (
                          <label className="text-xs font-semibold text-paper/70">
                            Outra quantidade *
                            <input className={fieldClass} name="quantityOther" type="number" min="1" step="1" inputMode="numeric" required />
                          </label>
                        )}

                        <label className="text-xs font-semibold text-paper/70">
                          Medidas aproximadas
                          <input className={fieldClass} name="dimensions" placeholder="Ex.: 18 × 12 × 8 cm" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Cor desejada
                          <input className={fieldClass} name="color" placeholder="Ex.: preto e roxo" />
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Material
                          <select className={fieldClass} name="material" defaultValue="Avaliar com a Orume">
                            <option>Avaliar com a Orume</option>
                            <option>PLA</option>
                            <option>Outro / não sei</option>
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          Precisa até quando?
                          <input className={fieldClass} name="deadline" type="date" />
                        </label>
                      </div>

                      <label className="mt-4 block text-xs font-semibold text-paper/70">
                        Links / referências
                        <textarea className={fieldClass + ' min-h-24 resize-y'} name="links" placeholder="MakerWorld, imagens, arquivos ou páginas de referência." />
                      </label>

                      <label className="mt-4 block text-xs font-semibold text-paper/70">
                        Detalhes do projeto
                        <textarea className={fieldClass + ' min-h-28 resize-y'} name="description" placeholder="Opcional: uso, encaixes, acabamento ou personalização." />
                      </label>
                    </section>

                    <section className="border-t border-accent/10 pt-7">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-accent/[0.65]">
                        03 — Entrega
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-paper/70">
                          Forma de entrega
                          <select className={fieldClass} name="delivery" defaultValue="Quero avaliar as opções">
                            <option>Quero avaliar as opções</option>
                            <option>Retirada</option>
                            <option>Correios</option>
                            <option>Transportadora</option>
                            <option>Entrega local</option>
                            <option>Outro</option>
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-paper/70">
                          CEP para cálculo de envio *
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
                      </div>
                      <label className="mt-4 block text-xs font-semibold text-paper/70">
                        Observações
                        <textarea className={fieldClass + ' min-h-24 resize-y'} name="notes" />
                      </label>
                    </section>

                    <section className="border-t border-accent/10 pt-7">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-accent/[0.65]">
                        04 — Preferência de atendimento
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (cleanService) setCleanService(false);
                          else setCleanModalOpen(true);
                        }}
                        className={`mt-4 flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                          cleanService
                            ? 'border-accent/[0.35] bg-accent/10'
                            : 'border-accent/10 bg-paper/[0.03] hover:border-accent/25'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          cleanService ? 'border-accent bg-accent text-ink' : 'border-paper/20'
                        }`}>
                          {cleanService ? '✓' : ''}
                        </span>
                        <span>
                          <strong className="block text-sm text-paper/90">
                            Prefiro atendimento com o mínimo de interação
                          </strong>
                          <small className="mt-1 block text-xs leading-5 text-muted/70">
                            Comunicação direta, objetiva e somente pelo WhatsApp, limitada ao necessário para concluir o pedido.
                          </small>
                        </span>
                      </button>
                    </section>

                    <div className="border-t border-accent/10 pt-7">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group relative w-full overflow-hidden rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-ink shadow-glow transition enabled:hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span className="relative z-10">
                          {submitting ? 'Registrando…' : 'Finalizar orçamento'}
                        </span>
                        <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-paper/30 blur-sm transition-all duration-700 group-hover:left-[120%]" />
                      </button>
                      {status && (
                        <p className="mt-4 text-center text-sm leading-5 text-paper/70" aria-live="polite">
                          {status}
                        </p>
                      )}
                    </div>
                  </form>

                  <aside className="hidden border-l border-accent/10 bg-surface/[0.55] p-7 lg:block">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.26em] text-accent/[0.65]">
                      Como funciona
                    </p>
                    <ol className="mt-5 space-y-5 text-sm">
                      {[
                        ['01', 'Orçamento', 'A Orume avalia ideia, material, prazo, entrega e custos.'],
                        ['02', 'Aprovação', 'Você revisa o resumo antes de qualquer produção.'],
                        ['03', 'Pagamento', 'A condição combinada libera o pedido para a fila.'],
                        ['04', 'Produção', 'A peça entra em impressão e pós-processamento.'],
                        ['05', 'Entrega', 'Rastreio ou confirmação encerra o pedido.'],
                      ].map(([n, title, text]) => (
                        <li key={n} className="flex gap-3">
                          <span className="orume-metal-text font-bold">{n}</span>
                          <div>
                            <strong className="text-paper/80">{title}</strong>
                            <p className="mt-1 text-xs leading-5 text-muted/70">{text}</p>
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-8 rounded-2xl border border-accent/10 bg-paper/[0.03] p-4">
                      <p className="text-xs leading-5 text-muted/70">
                        Os dados enviados são usados para orçamento, contato, produção e entrega. O atendimento clean muda somente o estilo da conversa.
                      </p>
                    </div>
                  </aside>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="absolute right-5 top-5 rounded-full border border-accent/[0.15] bg-ink/80 p-2 text-muted backdrop-blur transition hover:border-accent/40 hover:text-accentLight disabled:opacity-40"
                >
                  <span className="sr-only">Fechar orçamento</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cleanModalOpen && (
          <Dialog open={cleanModalOpen} onClose={() => setCleanModalOpen(false)} className="fixed inset-0 z-[80]">
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <Dialog.Overlay
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-ink/90 backdrop-blur-md"
              />
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                className="orume-panel relative w-full max-w-lg rounded-3xl p-7"
              >
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-accent/70">
                  Atendimento clean
                </p>
                <Dialog.Title className="mt-2 font-display text-2xl text-paper">
                  Menos conversa. Mesma entrega.
                </Dialog.Title>
                <Dialog.Description className="mt-4 space-y-3 text-sm leading-6 text-muted">
                  <span className="block">
                    A comunicação será mantida no mínimo necessário e somente pelo WhatsApp: confirmação de informações, orçamento, pagamento, produção e entrega.
                  </span>
                  <span className="block">
                    A Orume evitará ao máximo formalidades desnecessárias, saudações repetidas, conversa social ou mensagens que não ajudem a concluir o pedido.
                  </span>
                </Dialog.Description>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-accent/10 bg-paper/[0.03] p-4">
                    <strong className="text-sm text-paper/80">Não muda</strong>
                    <p className="mt-1 text-xs leading-5 text-muted/70">
                      Preço, prazo, prioridade, qualidade ou condições do produto.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-accent/10 bg-paper/[0.03] p-4">
                    <strong className="text-sm text-paper/80">Muda apenas</strong>
                    <p className="mt-1 text-xs leading-5 text-muted/70">
                      O estilo do atendimento, deixando a conversa mais objetiva e enxuta.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setCleanService(false);
                      setCleanModalOpen(false);
                    }}
                    className="flex-1 rounded-full border border-accent/[0.15] px-5 py-3 text-sm font-semibold text-paper/70 transition hover:border-accent/[0.35]"
                  >
                    Não ativar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCleanService(true);
                      setCleanModalOpen(false);
                    }}
                    className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-bold text-ink shadow-glow"
                  >
                    Ativar atendimento clean
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuoteModal;
