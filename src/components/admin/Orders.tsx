import OrderImages from './OrderImages';
import { orderImageItems, type OrderImageProduct } from '../../lib/orderImages';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { MagnifyingGlassIcon, ArrowLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import type { Order } from '../../pages/Admin';
import { formatBRL } from '../../lib/format';

const closed = (o: Order) => ['Concluído', 'Cancelado'].includes(o.status);
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const date = (value: string) => {
  if (!value) return 'Sem data';
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};
const badge = (status: string) => status === 'Concluído' ? 'bg-emerald-400/10 text-emerald-200' : status === 'Cancelado' ? 'bg-red-400/10 text-red-200' : 'bg-amber-400/10 text-amber-200';
const fieldClass = 'mt-2 w-full min-w-0 rounded-xl border border-paper/15 bg-background px-3 py-3 text-sm font-normal text-paper outline-none focus:border-accent focus:ring-1 focus:ring-accent';
const groups: { title: string; fields: [string, keyof Order][] }[] = [
  { title: 'Andamento', fields: [['Status','status'],['Prioridade','priority'],['Prazo combinado','deadline']] },
  { title: 'Cliente e entrega', fields: [['Cliente','name'],['WhatsApp','phone'],['Cidade / UF','city'],['CEP','cep'],['Forma de entrega','delivery'],['Rastreio','tracking'],['Indicado por','referral'],['Atendimento clean','cleanService']] },
  { title: 'Peça e produção', fields: [['Produto','product'],['Quantidade','quantity'],['Cor','color'],['Material','material'],['Medidas aproximadas','dimensions']] },
  { title: 'Pagamento', fields: [['Valor a cobrar','amount'],['Valor pago','paid'],['Forma de pagamento','paymentMethod'],['Status do pagamento','paymentStatus']] },
];

type Props = { products: OrderImageProduct[]; orders: Order[]; selected: Order | null; setSelected: Dispatch<SetStateAction<Order | null>>; busy: boolean; save: () => void; complete: () => void };
export default function Orders({ orders, products, selected, setSelected, busy, save, complete }: Props) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('Todos');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('recent');
  const [limit, setLimit] = useState(30);
  const [mobileDetail, setMobileDetail] = useState(false);
  const filtered = useMemo(() => orders.filter(o => {
    const term = normalize(query).trim();
    return (scope === 'Todos' || (scope === 'Em aberto' ? !closed(o) : closed(o))) && (!status || o.status === status) && (!term || normalize([o.id, o.displayId, o.name, o.product, o.phone].join(' ')).includes(term));
  }).sort((a,b) => sort === 'value' ? Number(b.amount)-Number(a.amount) : (Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0) || b.id-a.id), [orders, query, scope, status, sort]);
  const update = (key: keyof Order, value: string) => setSelected(current => current ? { ...current, [key]: ['amount','paid'].includes(key) ? Number(value) : value } : current);
  const imagesFor = (order: Order) => orderImageItems(order, products);
  const openCount = orders.filter(o => !closed(o)).length;
  const balance = orders.filter(o => !closed(o)).reduce((sum,o) => sum + Math.max(0, Number(o.amount)-Number(o.paid)),0);
  return <div className="space-y-5 pb-16">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pedidos</h1><p className="mt-2 text-sm text-muted">Acompanhe cada peça, do primeiro contato à entrega.</p></div><p className="text-sm text-muted">A receber nos pedidos abertos <strong className="ml-2 text-lg text-paper">{formatBRL(balance)}</strong></p></div>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">{[['Todos',orders.length],['Em aberto',openCount],['Encerrados',orders.length-openCount]].map(([label,count]) => <button key={label} aria-pressed={scope===label} onClick={() => {setScope(String(label));setLimit(30);}} className={'rounded-xl border p-3 text-left transition sm:p-4 '+(scope===label?'border-accent/60 bg-accent/[0.07]':'border-paper/10 bg-surface hover:border-paper/30')}><span className="block text-xs text-muted sm:text-sm">{label}</span><strong className="mt-1 block text-2xl tabular-nums">{count}</strong></button>)}</div>
    <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
      <section aria-label="Lista de pedidos" className={(mobileDetail && selected ? 'hidden lg:block ' : '')+'min-w-0'}>
        <div className="space-y-3 rounded-t-2xl border border-paper/10 bg-surface p-4">
          <label className="relative block"><span className="sr-only">Buscar pedidos</span><MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted"/><input value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}} placeholder="Cliente, peça, número ou WhatsApp" className={fieldClass+' !mt-0 pl-10'}/></label>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs text-muted">Status<select className={fieldClass} value={status} onChange={e=>{setStatus(e.target.value);setLimit(30);}}><option value="">Todos os status</option>{[...new Set(orders.map(o=>o.status))].filter(Boolean).sort().map(s=><option key={s}>{s}</option>)}</select></label><label className="text-xs text-muted">Ordenar<select className={fieldClass} value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Mais recentes</option><option value="value">Maior valor</option></select></label></div>
          <p aria-live="polite" className="text-xs text-muted">{filtered.length} {filtered.length===1?'pedido encontrado':'pedidos encontrados'}</p>
        </div>
        <div className="space-y-2 rounded-b-2xl border border-t-0 border-paper/10 bg-surface/50 p-3 lg:max-h-[70vh] lg:overflow-y-auto">
          {filtered.slice(0,limit).map(o=><button key={o.id} disabled={busy} aria-pressed={selected?.id===o.id} onClick={()=>{setSelected({...o});setMobileDetail(true);}} className={'w-full rounded-xl border p-4 text-left transition focus-visible:outline-accent disabled:opacity-50 '+(selected?.id===o.id?'border-accent/70 bg-accent/[0.08]':'border-paper/10 bg-background/50 hover:border-paper/30')}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs text-muted">#{o.displayId} · {date(o.createdAt)}</span><span className={'rounded-md px-2 py-1 text-xs '+badge(o.status)}>{o.status || 'Sem status'}</span></div>
            <OrderImages items={imagesFor(o)}/><h2 className="mt-3 break-words text-base font-semibold">{o.name || 'Sem cliente'}</h2><p className="mt-1 line-clamp-2 break-words text-sm text-muted">{o.quantity || 1} × {o.product || 'Peça não informada'}</p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-paper/10 pt-3"><div><p className="text-xs text-muted">Total</p><strong className="text-base tabular-nums">{o.amount ? formatBRL(o.amount) : 'A definir'}</strong></div><div className="text-right text-xs text-muted">{o.priority && <p className="mb-1 text-paper/80">Prioridade: {o.priority}</p>}{o.deadline ? <p>Prazo: {date(o.deadline)}</p> : <p>{o.paymentStatus || 'Pagamento a combinar'}</p>}</div></div>
          </button>)}
          {!filtered.length && <div className="px-4 py-12 text-center"><ShoppingBagIcon className="mx-auto mb-3 h-8 w-8 text-muted"/><p className="text-sm">{orders.length?'Nenhum pedido com esses filtros.':'Os pedidos aparecerão aqui.'}</p>{orders.length>0 && <button onClick={()=>{setQuery('');setStatus('');setScope('Todos');}} className="mt-4 text-sm text-accent underline">Limpar filtros</button>}</div>}
          {filtered.length>limit && <button onClick={()=>setLimit(n=>n+30)} className="w-full rounded-xl border border-paper/15 p-3 text-sm text-paper">Mostrar mais pedidos ({filtered.length-limit})</button>}
        </div>
      </section>
      <section aria-label="Detalhes do pedido" className={(!mobileDetail?'hidden lg:block ':'')+'min-w-0 self-start rounded-2xl border border-paper/10 bg-surface p-4 sm:p-6'}>
        {!selected ? <div className="py-24 text-center"><ShoppingBagIcon className="mx-auto h-10 w-10 text-muted/50"/><h2 className="mt-4 text-lg font-semibold">Escolha um pedido</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">Veja os detalhes da peça, acompanhe o pagamento e atualize o andamento.</p></div> : <>
          <button onClick={()=>setMobileDetail(false)} className="mb-5 inline-flex items-center gap-2 py-2 text-sm text-accent lg:hidden"><ArrowLeftIcon className="h-4 w-4"/> Voltar aos pedidos</button>
          <div className="border-b border-paper/10 pb-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-sm text-muted">Pedido #{selected.displayId}</p><span className={'rounded-md px-2 py-1 text-xs '+badge(selected.status)}>{selected.status || 'Sem status'}</span></div><h2 className="mt-3 break-words text-2xl font-semibold">{selected.name || 'Sem cliente'}</h2><p className="mt-2 text-sm text-muted">Criado em {date(selected.createdAt)}</p></div>
          <OrderImages items={imagesFor(selected)} detail/><div className="my-5 grid grid-cols-3 gap-2">{[['Total',selected.amount],['Pago',selected.paid],['Saldo',Math.max(0,Number(selected.amount)-Number(selected.paid))]].map(([label,value])=><div key={label} className="rounded-xl bg-background p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-base">{formatBRL(Number(value))}</p></div>)}</div>
          <div className="space-y-6">{groups.map(group=><fieldset key={group.title}><legend className="mb-3 text-base font-semibold">{group.title}</legend><div className="grid gap-4 sm:grid-cols-2">{group.fields.map(([label,key])=><label key={key} className={'min-w-0 text-xs text-muted '+(key==='product'?'sm:col-span-2':'')}>{label}<input className={fieldClass} type={['amount','paid','quantity'].includes(key)?'number':'text'} step={key==='quantity'?'1':'any'} value={String(selected[key]??'')} onChange={e=>update(key,e.target.value)}/></label>)}</div></fieldset>)}
          <fieldset><legend className="mb-3 text-base font-semibold">Referências e observações</legend>{([['Detalhes do projeto','description'],['Links / referências','links'],['Observações internas','notes']] as [string,keyof Order][]).map(([label,key])=><label key={key} className="mb-4 block text-xs text-muted">{label}<textarea className={fieldClass+' min-h-24 resize-y'} value={String(selected[key]??'')} onChange={e=>update(key,e.target.value)}/></label>)}</fieldset></div>
          <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap gap-3 rounded-b-2xl border-t border-paper/10 bg-surface p-4 sm:-mx-6 sm:-mb-6 sm:px-6"><button disabled={busy} onClick={save} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-ink disabled:opacity-40">{busy?'Aguarde…':'Salvar alterações'}</button><button disabled={busy || closed(selected)} onClick={complete} className="rounded-xl border border-paper/20 px-5 py-3 text-sm text-paper disabled:opacity-40">Marcar como concluído</button></div>
        </>}
      </section>
    </div>
  </div>;
}
