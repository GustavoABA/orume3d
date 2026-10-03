import { useAffiliate } from '../../context/AffiliateContext';
import { Dialog } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { loadBackendConfig, postBackend } from '../../lib/backend';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

type QuoteModalProps = { open: boolean; onClose: () => void };
const fieldClass = 'mt-2 w-full rounded-lg border border-paper/20 bg-ink px-3 py-3 text-base text-paper outline-none placeholder:text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent';

const QuoteModal = ({ open, onClose }: QuoteModalProps) => {
  const affiliate = useAffiliate();
  const pendingQuote = useRef({ signature: '', id: '' });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!open) { setStep(1); setStatus(''); }
  }, [open]);
  useEffect(() => { if (open) titleRef.current?.focus(); }, [step, confirmed, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) || '').trim();
    const phone = value('phone');
    const digits = phone.replace(/\D/g, '');
    const localPhone = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
    if (localPhone.length < 10 || localPhone.length > 11) {
      setStep(1); setStatus('Confira o WhatsApp com DDD.'); return;
    }
    if (step === 1) { setStatus(''); setStep(2); return; }
    if (value('cep').replace(/\D/g, '').length !== 8) { setStatus('Informe um CEP com 8 dígitos.'); return; }

    const payload = {
      affiliateCode: affiliate?.code || '', affiliateRate: affiliate?.rate,
      action: 'quote', name: value('name'), phone, product: value('product'), quantity: value('quantity'),
      cep: value('cep'), city: value('city'), delivery: 'A combinar',
      links: value('links'), description: value('description'), dimensions: value('dimensions'),
      color: value('color'), material: value('material'), deadline: value('deadline'),
      cleanService: data.get('cleanService') === 'on',
    };
    const signature = JSON.stringify(payload);
    if (pendingQuote.current.signature !== signature) {
      pendingQuote.current = { signature, id: `SITE-${crypto.randomUUID()}` };
    }
    setSubmitting(true); setStatus('Registrando seu orçamento…');
    try {
      const config = await loadBackendConfig();
      const result = await postBackend(config.endpoint, { ...payload, siteId: pendingQuote.current.id });
      if (!result.orderId) throw new Error('O backend não confirmou o número do orçamento.');
      const url = buildWhatsAppUrl([
        'Olá, enviei um orçamento pelo site da orume.',
        affiliate ? `Afiliado: ${affiliate.code} (${affiliate.rate}%)` : '',
        `Protocolo: ${result.orderId}`,
        `Nome: ${payload.name}`,
        `Peça: ${payload.product}`,
        `Quantidade: ${payload.quantity}`,
        'Gostaria de continuar o atendimento por aqui.',
      ].join('\n'));
      setConfirmed({ id: result.orderId, url });
      pendingQuote.current = { signature: '', id: '' };
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível confirmar o orçamento.');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onClose={submitting ? () => undefined : onClose} className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <Dialog.Overlay className="fixed inset-0 bg-ink/90" />
        <Dialog.Panel className="orume-panel relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl">
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Fechar orçamento" className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:text-paper disabled:opacity-40"><XMarkIcon className="h-6 w-6" /></button>
          <div className="p-6 sm:p-8">
            {confirmed ? <>
              <CheckCircleIcon className="h-10 w-10 text-accentLight" />
              <Dialog.Title ref={titleRef} tabIndex={-1} className="mt-4 text-3xl font-semibold outline-none">Orçamento recebido.</Dialog.Title>
              <Dialog.Description className="mt-3 text-base leading-7 text-muted">Seu protocolo é <strong className="text-paper">{confirmed.id}</strong>. Já recebemos as informações. Se quiser, continue a conversa pelo WhatsApp.</Dialog.Description>
              <a href={confirmed.url} className="orume-primary mt-7 w-full">Continuar no WhatsApp</a>
              <p className="mt-3 text-sm leading-6 text-muted">A mensagem abrirá com seu protocolo. Toque em enviar no WhatsApp para iniciar a conversa.</p>
              <button type="button" onClick={() => { setConfirmed(null); setStep(1); }} className="mt-6 text-sm text-paper underline underline-offset-4">Pedir outro orçamento</button>
            </> : <>
              <p className="pr-10 text-sm text-accentLight">Orçamento · etapa {step} de 2</p>
              <Dialog.Title ref={titleRef} tabIndex={-1} className="mt-3 pr-5 text-3xl font-semibold tracking-tight outline-none">{step === 1 ? 'O que vamos imprimir?' : 'Onde você vai receber?'}</Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-muted">{step === 1 ? 'Conte o básico. Podemos acertar os detalhes depois.' : 'O CEP ajuda a calcular o frete. O valor será combinado antes de qualquer pagamento.'}</Dialog.Description>
              <form onSubmit={handleSubmit} className="mt-6" noValidate>
                <fieldset disabled={submitting}>
                  <div hidden={step !== 1} className="space-y-4">
                    <label className="block text-sm font-medium">Seu nome<input className={fieldClass} name="name" required={step === 1} autoComplete="name" maxLength={180} /></label>
                    <label className="block text-sm font-medium">WhatsApp com DDD<input className={fieldClass} name="phone" required={step === 1} autoComplete="tel" inputMode="tel" placeholder="(19) 99999-9999" /></label>
                    <label className="block text-sm font-medium">O que quer imprimir?<input className={fieldClass} name="product" required={step === 1} placeholder="Ex.: um suporte com meu nome" maxLength={240} /></label>
                    <label className="block text-sm font-medium">Quantidade<input className={fieldClass} name="quantity" type="number" min="1" max="9999" step="1" defaultValue="1" required={step === 1} inputMode="numeric" /></label>
                  </div>
                  <div hidden={step !== 2} className="space-y-4">
                    <label className="block text-sm font-medium">CEP<input className={fieldClass} name="cep" required={step === 2} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}-?[0-9]{3}" placeholder="00000-000" /></label>
                    <label className="block text-sm font-medium">Cidade / UF <span className="font-normal text-muted">(opcional)</span><input className={fieldClass} name="city" autoComplete="address-level2" placeholder="Ex.: Leme/SP" /></label>
                    <details className="border-y border-paper/10 py-4">
                      <summary className="cursor-pointer text-sm font-medium text-paper">Quer acrescentar algum detalhe? <span className="font-normal text-muted">Opcional</span></summary>
                      <div className="mt-4 space-y-4">
                        <label className="block text-sm">Link de referência<input className={fieldClass} name="links" placeholder="Link de uma foto, modelo ou arquivo" /></label>
                        <label className="block text-sm">Conte mais sobre a peça<textarea className={fieldClass} name="description" rows={3} maxLength={3000} /></label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm">Medidas aproximadas<input className={fieldClass} name="dimensions" placeholder="Ex.: 10 × 8 cm" /></label>
                          <label className="text-sm">Cor<input className={fieldClass} name="color" /></label>
                          <label className="text-sm">Material<select className={fieldClass} name="material" defaultValue="Avaliar com a Orume"><option>Avaliar com a Orume</option><option>PLA</option><option>Outro / não sei</option></select></label>
                          <label className="text-sm">Precisa até quando?<input className={fieldClass} type="date" name="deadline" /></label>
                        </div>
                      </div>
                    </details>
                    <label className="flex items-start gap-3 text-sm leading-6 text-muted"><input className="mt-1 h-4 w-4 accent-accent" type="checkbox" name="cleanService" /><span>Prefiro mensagens objetivas, só sobre meu pedido.</span></label>
                  </div>
                  {status && <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-paper">{status}</p>}
                  <div className="mt-6 flex items-center gap-3">
                    {step === 2 && <button type="button" onClick={() => { setStep(1); setStatus(''); }} className="orume-secondary">Voltar</button>}
                    <button type="submit" className="orume-primary flex-1 disabled:opacity-50">{submitting ? 'Registrando…' : step === 1 ? 'Continuar' : 'Enviar orçamento'}</button>
                  </div>
                </fieldset>
                <p className="mt-4 text-xs leading-5 text-muted">{step === 1 ? 'Você não precisa ter um arquivo 3D pronto.' : 'Usamos seus dados para responder ao orçamento e combinar a entrega. O envio não confirma uma compra.'}</p>
              </form>
            </>}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
export default QuoteModal;
