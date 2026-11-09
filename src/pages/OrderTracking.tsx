import { useEffect, useState, type FormEvent } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, LockClosedIcon, TruckIcon } from '@heroicons/react/24/outline';
import { jsonp, loadBackendConfig, postBackend } from '../lib/backend';

type TrackingOrder = {
  displayId: string;
  updatedAt: string;
  status: string;
  priority: string;
  deadline: string;
  name: string;
  phone: string;
  city: string;
  cep: string;
  referral: string;
  cleanService: string;
  delivery: string;
  tracking: string;
  product: string;
  quantity: number | string;
  dimensions: string;
  color: string;
  material: string;
};

type TrackingResponse = { ok: boolean; error?: string; order?: TrackingOrder };
type Editable = Pick<TrackingOrder, 'name' | 'phone' | 'city' | 'cep' | 'referral' | 'cleanService'>;

const emptyDraft: Editable = { name: '', phone: '', city: '', cep: '', referral: '', cleanService: 'Não' };
const fieldClass = 'mt-1.5 w-full rounded-xl border border-paper/15 bg-background px-3.5 py-3 text-sm text-paper outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40';
const formatDate = (value: string) => {
  if (!value) return 'A confirmar';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

export default function OrderTracking() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [endpoint, setEndpoint] = useState('');
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [draft, setDraft] = useState<Editable>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Acompanhar pedido | Orume 3D';
    if (!/^[0-9a-f]{64}$/i.test(token)) {
      setLoading(false);
      setError('O link de acompanhamento é inválido ou não foi informado.');
      return;
    }
    let active = true;
    loadBackendConfig().then(config => {
      if (active) setEndpoint(config.endpoint);
    }).catch(reason => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o sistema.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!endpoint || !token) return;
    let active = true;
    const fetchOrder = async () => {
      try {
        const result = await jsonp<TrackingResponse>(endpoint, { action: 'customerOrder', token }, 30000);
        if (!result.ok || !result.order) throw new Error(result.error || 'Pedido indisponível.');
        if (!active) return;
        setOrder(result.order);
        if (!dirty) {
          const current = result.order;
          setDraft({
            name: current.name,
            phone: current.phone,
            city: current.city,
            cep: current.cep,
            referral: current.referral,
            cleanService: current.cleanService === 'Sim' ? 'Sim' : 'Não',
          });
        }
        setError('');
      } catch (reason) {
        if (!active) return;
        setOrder(null);
        setError(reason instanceof Error ? reason.message : 'O acompanhamento não está disponível.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchOrder();
    const interval = window.setInterval(() => { if (!saving) void fetchOrder(); }, 45000);
    return () => { active = false; window.clearInterval(interval); };
  }, [endpoint, token, dirty, saving]);

  const change = (key: keyof Editable, value: string) => {
    setDraft(current => ({ ...current, [key]: value }));
    setDirty(true);
    setNotice('');
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) { setError('Informe seu nome.'); return; }
    if (!/^(?:55)?\d{10,11}$/.test(draft.phone.replace(/\D/g, ''))) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (draft.cep.trim() && draft.cep.replace(/\D/g, '').length !== 8) {
      setError('Informe um CEP de 8 dígitos ou deixe o campo em branco.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await postBackend<TrackingResponse>(endpoint, { action: 'customerUpdateOrder', token, changes: draft });
      if (!result.order) throw new Error('Não foi possível confirmar a atualização.');
      setOrder(result.order);
      setDraft({
        name: result.order.name,
        phone: result.order.phone,
        city: result.order.city,
        cep: result.order.cep,
        referral: result.order.referral,
        cleanService: result.order.cleanService === 'Sim' ? 'Sim' : 'Não',
      });
      setDirty(false);
      setNotice('Seus dados foram atualizados com sucesso.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar seus dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-8 text-paper sm:px-8 sm:py-12">
      <div className="orume-grid pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-accent/15 pb-5">
          <a href="/" className="orume-metal-text font-display text-2xl tracking-[0.16em]">ORUME 3D</a>
          <div className="flex items-center gap-2 text-xs text-muted"><LockClosedIcon className="h-4 w-4" /> Acompanhamento exclusivo</div>
        </header>
        {loading && <section className="orume-panel rounded-3xl p-8 text-center text-muted">Carregando informações do pedido…</section>}
        {!loading && !order && <section className="orume-panel rounded-3xl p-8 text-center">
          <LockClosedIcon className="mx-auto h-10 w-10 text-accentLight" />
          <h1 className="mt-4 font-display text-2xl">Acompanhamento indisponível</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">{error || 'Este link foi encerrado ou não existe.'}</p>
          <a href="/" className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Voltar à loja</a>
        </section>}
        {order && <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accentLight">Pedido #{order.displayId}</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">Acompanhe seu pedido</h1></div>
            <p className="inline-flex items-center gap-2 text-xs text-muted"><ClockIcon className="h-4 w-4" /> Atualizado {formatDate(order.updatedAt)}</p>
          </div>
          <section className="orume-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Andamento</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-accent/20 bg-accent/[0.06] p-4"><p className="text-xs text-muted">Status atual</p><p className="mt-2 break-words text-lg font-semibold text-accentLight">{order.status || 'Aguardando atualização'}</p></div>
              <div className="rounded-2xl border border-paper/10 bg-background/60 p-4"><p className="text-xs text-muted">Prioridade</p><p className="mt-2 font-semibold">{order.priority || 'A definir'}</p></div>
              <div className="rounded-2xl border border-paper/10 bg-background/60 p-4"><p className="text-xs text-muted">Prazo combinado</p><p className="mt-2 font-semibold">{formatDate(order.deadline)}</p></div>
            </div>
            <p className="mt-4 text-xs text-muted">A Orume atualiza o andamento conforme a produção avança. Esta página consulta as alterações periodicamente.</p>
          </section>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="orume-panel rounded-3xl p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Cliente e contato</h2>
              <p className="mt-2 text-xs leading-5 text-muted">Atualize seus dados para facilitar a confirmação do pedido. Os campos de entrega e rastreio são definidos pela Orume.</p>
              <form className="mt-5 space-y-4" onSubmit={save}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {([['name','Nome'],['phone','WhatsApp'],['city','Cidade / UF'],['cep','CEP'],['referral','Indicado por']] as [keyof Editable,string][]).map(([key,label]) =>
                    <label key={key} className={key==='referral'?'block text-xs text-muted sm:col-span-2':'block text-xs text-muted'}>{label}<input className={fieldClass} value={draft[key]} onChange={event=>change(key,event.target.value)} required={key==='name'||key==='phone'} autoComplete={key==='name'?'name':key==='phone'?'tel':key==='cep'?'postal-code':'off'} placeholder={key==='cep'?'Opcional, 8 dígitos':key==='city'?'Cidade / UF':undefined}/></label>
                  )}
                </div>
                <label className="block text-xs text-muted">Atendimento clean
                  <select className={fieldClass} value={draft.cleanService} onChange={event=>change('cleanService',event.target.value)}>
                    <option value="Não">Não</option><option value="Sim">Sim</option>
                  </select>
                </label>
                {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
                {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircleIcon className="h-4 w-4" />{notice}</p>}
                <button type="submit" disabled={saving||!dirty} className="w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-ink disabled:opacity-40">{saving?'Salvando…':'Salvar meus dados'}</button>
              </form>
            </section>
            <div className="space-y-6">
              <section className="orume-panel rounded-3xl p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><TruckIcon className="h-5 w-5 text-accentLight" /> Entrega</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div><dt className="text-xs text-muted">Forma de entrega</dt><dd className="mt-1 font-medium">{order.delivery || 'A combinar'}</dd></div>
                  <div><dt className="text-xs text-muted">Código de rastreio</dt><dd className="mt-1 break-all font-mono text-sm">{order.tracking || 'Aguardando informação da Orume'}</dd></div>
                </dl>
                <p className="mt-4 text-xs text-muted">Essas informações são preenchidas pela equipe da Orume.</p>
              </section>
              <section className="orume-panel rounded-3xl p-6">
                <h2 className="text-xl font-semibold">Peça e produção</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {([['Produto',order.product],['Quantidade',order.quantity],['Cor',order.color],['Material',order.material],['Medidas aproximadas',order.dimensions]] as [string,string|number][]).map(([label,value])=>
                    <div key={label} className="border-b border-paper/10 pb-3 last:border-0"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium">{String(value||'A definir')}</dd></div>
                  )}
                </dl>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted"><LockClosedIcon className="h-4 w-4" /> Informações somente para consulta.</p>
              </section>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-muted"><p>Guarde este link privado. Não compartilhe com outras pessoas.</p><button type="button" onClick={()=>window.location.reload()} className="inline-flex items-center gap-2 rounded-full border border-accent/25 px-4 py-2 text-accentLight"><ArrowPathIcon className="h-4 w-4" />Atualizar agora</button></div>
        </div>}
      </div>
    </main>
  );
}
