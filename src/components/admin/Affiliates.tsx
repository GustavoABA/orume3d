import { useState, type FormEvent } from 'react';
import { postBackend } from '../../lib/backend';
import { affiliatePrice, type Affiliate } from '../../lib/affiliate';
import { formatBRL } from '../../lib/format';

const empty = (): Affiliate => ({ code: '', name: '', rate: 20, active: true });
export default function Affiliates({ affiliates, supported, endpoint, adminKey, refresh }: {
  affiliates: Affiliate[]; supported: boolean; endpoint: string; adminKey: string; refresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const link = (code: string) => `https://orume.com.br/?afiliado=${encodeURIComponent(code)}`;
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await postBackend(endpoint, { action: 'adminSaveAffiliate', adminKey, affiliate: draft, mode: editing ? 'update' : 'create' });
      setMessage('Afiliado salvo na planilha.'); setEditing(true); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setBusy(false); }
  };
  if (!supported) return <section className="orume-panel rounded-2xl p-6"><h2 className="text-xl">Atualize o Apps Script</h2><p className="mt-3 text-muted">O backend conectado ainda não tem suporte a afiliados. Instale a versão atual de Orume_Backend_Atual.gs e publique uma nova versão da implantação existente. Depois atualize esta página.</p></section>;
  return <section className="grid gap-6 lg:grid-cols-2">
    <div className="orume-panel rounded-2xl p-6"><h2 className="text-2xl">Afiliados</h2><p className="my-4 text-sm text-muted">O acréscimo entra no preço de cada peça. Não altera o preço base da planilha nem o frete. O último link aberto vale durante a sessão do navegador.</p>
      <button type="button" disabled={busy} className="orume-secondary mb-4" onClick={() => { setDraft(empty()); setEditing(false); setMessage(''); }}>Novo afiliado</button>
      {!affiliates.length && <p>Nenhum afiliado cadastrado.</p>}
      <ul className="space-y-4">{affiliates.map(item => <li key={item.code} className="rounded-lg border border-paper/15 p-4"><div className="flex justify-between gap-3"><strong>{item.name}</strong><span>{item.rate}% · {item.active ? 'Ativo' : 'Inativo'}</span></div><p className="my-2 break-all text-sm text-muted">{link(item.code)}</p><div className="flex gap-4"><button type="button" disabled={busy} className="underline" onClick={() => { setDraft({ ...item }); setEditing(true); setMessage(''); }}>Editar</button><button type="button" className="underline" onClick={async () => { try { await navigator.clipboard.writeText(link(item.code)); setMessage('Link copiado.'); } catch { setMessage('Não foi possível copiar. Selecione o endereço exibido.'); } }}>Copiar link</button></div></li>)}</ul>
    </div>
    <form onSubmit={save} className="orume-panel rounded-2xl p-6"><h2 className="mb-5 text-xl">{editing ? 'Editar afiliado' : 'Criar afiliado'}</h2><fieldset disabled={busy} className="space-y-4">
      <label className="block">Nome<input required maxLength={120} className="mt-2 w-full rounded-lg bg-ink p-3" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Linux" /></label>
      <label className="block">Código do link<input required readOnly={editing} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className="mt-2 w-full rounded-lg bg-ink p-3" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toLowerCase() })} placeholder="afiliado-linux" /><span className="text-xs text-muted">Letras minúsculas, números e hífens. O código fica fixo após criar.</span></label>
      <label className="block">Acréscimo (%)<input required type="number" min="0" max="1000" step="0.01" className="mt-2 w-full rounded-lg bg-ink p-3" value={draft.rate} onChange={e => setDraft({ ...draft, rate: Number(e.target.value) })} /></label>
      <p className="text-sm text-muted">Exemplo: uma peça de R$ 80,00 fica por {formatBRL(affiliatePrice(80, draft.rate))}.</p>
      <label className="flex gap-3"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Link ativo</label>
      <button className="orume-primary" type="submit">{busy ? 'Salvando…' : 'Salvar afiliado'}</button>
    </fieldset><p role="status" className="mt-4 text-sm">{message}</p></form>
  </section>;
}
