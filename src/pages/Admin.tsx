import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, CubeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { loadBackendConfig, jsonp, postNoCors } from '../lib/backend';
import { formatBRL } from '../lib/format';

type Order = {
  id: number;
  displayId: string;
  createdAt: string;
  status: string;
  priority: string;
  name: string;
  phone: string;
  city: string;
  cep: string;
  referral: string;
  product: string;
  quantity: number | string;
  dimensions: string;
  color: string;
  material: string;
  deadline: string;
  links: string;
  description: string;
  delivery: string;
  cleanService: string;
  notes: string;
  amount: number;
  paid: number;
  balance: number;
  paymentMethod: string;
  paymentStatus: string;
  tracking: string;
};

type Product = {
  id: number;
  sku: string;
  active: string;
  featured: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  salePrice: number;
  stock: number;
  productionDays: number;
  shopeeUrl: string;
  scrapeStatus: string;
  scrapeAttemptAt: string;
  detectedTitle: string;
  detectedPrice: number;
  detectedImage: string;
  imageMain: string;
  image2: string;
  image3: string;
  adminNotes: string;
};

type Snapshot = { ok: boolean; error?: string; orders?: Order[]; products?: Product[] };
type ScrapeResult = {
  ok: boolean;
  blocked?: boolean;
  status?: string;
  error?: string;
  title?: string;
  price?: number;
  image?: string;
  description?: string;
};

const emptyProduct = (): Product => ({
  id: 0,
  sku: '',
  active: 'Sim',
  featured: 'Não',
  name: '',
  slug: '',
  category: 'Utilidades',
  description: '',
  price: 0,
  salePrice: 0,
  stock: 0,
  productionDays: 2,
  shopeeUrl: '',
  scrapeStatus: '',
  scrapeAttemptAt: '',
  detectedTitle: '',
  detectedPrice: 0,
  detectedImage: '',
  imageMain: '',
  image2: '',
  image3: '',
  adminNotes: '',
});

const inputClass =
  'mt-1.5 w-full rounded-xl border border-accent/12 bg-black/45 px-3.5 py-2.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-700 focus:border-accent/40 focus:ring-2 focus:ring-accent/10';

const Admin = () => {
  const [endpoint, setEndpoint] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('orume:adminKey') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(emptyProduct());
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const completed = (value: string) => value === 'Concluído' || value === 'Cancelado';

  const getSnapshot = async (key: string, targetEndpoint = endpoint) => {
    if (!targetEndpoint) throw new Error('Endpoint não carregado.');
    const data = await jsonp<Snapshot>(
      targetEndpoint,
      {
        action: 'adminSnapshot',
        adminKey: key,
      },
      60000
    );
    if (!data.ok) throw new Error(data.error || 'Falha ao carregar administração.');
    setOrders(data.orders || []);
    setProducts(data.products || []);
    if (selectedOrder) {
      const fresh = (data.orders || []).find((item) => item.id === selectedOrder.id);
      if (fresh) setSelectedOrder(fresh);
    }
    if (selectedProduct.id) {
      const fresh = (data.products || []).find((item) => item.id === selectedProduct.id);
      if (fresh) setSelectedProduct(fresh);
    }
  };

  useEffect(() => {
    loadBackendConfig()
      .then((config) => {
        setEndpoint(config.endpoint);
        if (adminKey) {
          setBusy(true);
          getSnapshot(adminKey, config.endpoint)
            .catch((error) => {
              setStatus(error instanceof Error ? error.message : 'Falha no login.');
              sessionStorage.removeItem('orume:adminKey');
              setAdminKey('');
            })
            .finally(() => setBusy(false));
        }
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : 'Falha no backend.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setBusy(true);
    setStatus('Validando acesso…');
    try {
      await getSnapshot(key);
      sessionStorage.setItem('orume:adminKey', key);
      setAdminKey(key);
      setKeyInput('');
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Acesso negado.');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    setStatus('Atualizando…');
    try {
      await getSnapshot(adminKey);
      setStatus('Dados atualizados.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao atualizar.');
    } finally {
      setBusy(false);
    }
  };

  const saveOrder = async () => {
    if (!selectedOrder) return;
    setBusy(true);
    setStatus('Salvando pedido…');
    try {
      await postNoCors(endpoint, {
        action: 'adminSaveOrder',
        adminKey,
        order: selectedOrder,
      });
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      await getSnapshot(adminKey);
      setStatus('Pedido salvo.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar pedido.');
    } finally {
      setBusy(false);
    }
  };

  const completeOrder = async () => {
    if (!selectedOrder) return;
    setBusy(true);
    setStatus('Concluindo pedido…');
    try {
      await postNoCors(endpoint, {
        action: 'adminCompleteOrder',
        adminKey,
        id: selectedOrder.id,
      });
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      await getSnapshot(adminKey);
      setStatus('Pedido marcado como concluído.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao concluir.');
    } finally {
      setBusy(false);
    }
  };

  const scrape = async () => {
    if (!selectedProduct.shopeeUrl.trim()) {
      setStatus('Cole primeiro o link do produto na Shopee.');
      return;
    }
    setBusy(true);
    setStatus('Tentando ler a página da Shopee…');
    try {
      const result = await jsonp<ScrapeResult>(
        endpoint,
        {
          action: 'scrapeShopee',
          adminKey,
          url: selectedProduct.shopeeUrl.trim(),
        },
        25000
      );
      const now = new Date().toISOString();
      setSelectedProduct((current) => ({
        ...current,
        name: current.name || result.title || '',
        description: current.description || result.description || '',
        price: current.price || Number(result.price || 0),
        imageMain: current.imageMain || result.image || '',
        scrapeStatus: result.status || (result.ok ? 'Dados detectados' : 'Falhou'),
        scrapeAttemptAt: now,
        detectedTitle: result.title || '',
        detectedPrice: Number(result.price || 0),
        detectedImage: result.image || '',
      }));
      setStatus(
        result.ok
          ? 'Scraping encontrou dados. Confira e salve o produto.'
          : result.error || result.status || 'A Shopee não expôs dados utilizáveis.'
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha no scraping.');
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!selectedProduct.name.trim()) {
      setStatus('Informe o nome do produto.');
      return;
    }
    setBusy(true);
    setStatus('Salvando produto…');
    try {
      await postNoCors(endpoint, {
        action: 'adminSaveProduct',
        adminKey,
        product: selectedProduct,
      });
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      await getSnapshot(adminKey);
      setStatus('Produto salvo no catálogo.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar produto.');
    } finally {
      setBusy(false);
    }
  };

  const visibleOrders = useMemo(() => orders.slice(0, 250), [orders]);

  if (!adminKey) {
    return (
      <main className="min-h-screen bg-background px-5 py-16 text-stone-100">
        <form onSubmit={login} className="orume-panel mx-auto max-w-md rounded-3xl p-7">
          <img src="/orume3d/brand/orume-mark.webp" alt="" className="mx-auto h-14 w-14 object-contain" />
          <p className="mt-5 text-center text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">
            Administração Orume
          </p>
          <h1 className="mt-2 text-center font-display text-3xl">Acesso privado</h1>
          <p className="mt-3 text-center text-sm leading-6 text-stone-500">
            Use a chave configurada no Apps Script. Ela fica apenas nesta sessão do navegador.
          </p>
          <label className="mt-6 block text-xs font-semibold text-stone-400">
            Chave administrativa
            <input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </label>
          <button
            disabled={busy}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-5 py-3 text-sm font-bold text-black shadow-glow disabled:opacity-50"
          >
            Entrar
          </button>
          {status && <p className="mt-4 text-center text-xs leading-5 text-stone-500">{status}</p>}
          <a href="/orume3d/" className="mt-5 block text-center text-xs text-stone-600 hover:text-accentLight">
            ← Voltar para a loja
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-stone-100">
      <header className="sticky top-0 z-30 border-b border-accent/12 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/orume3d/brand/orume-mark.webp" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="orume-metal-text font-display text-xl tracking-[0.16em]">ORUME ADMIN</p>
              <p className="text-[0.55rem] uppercase tracking-[0.22em] text-stone-600">backend operacional</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI/edit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 px-4 py-2 text-xs text-stone-400 hover:border-accent/40 hover:text-accentLight"
            >
              Planilha <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 px-4 py-2 text-xs text-stone-400 hover:border-accent/40 hover:text-accentLight disabled:opacity-40"
            >
              <ArrowPathIcon className="h-4 w-4" /> Atualizar
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('orume:adminKey');
                setAdminKey('');
              }}
              className="rounded-full border border-red-900/40 px-4 py-2 text-xs text-red-300"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab('orders')}
            className={'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] ' + (tab === 'orders' ? 'bg-accent text-black' : 'border border-accent/15 text-stone-400')}
          >
            <ShoppingBagIcon className="h-4 w-4" /> Pedidos
          </button>
          <button
            onClick={() => setTab('products')}
            className={'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] ' + (tab === 'products' ? 'bg-accent text-black' : 'border border-accent/15 text-stone-400')}
          >
            <CubeIcon className="h-4 w-4" /> Produtos
          </button>
        </div>

        {status && (
          <div className="mb-5 rounded-2xl border border-accent/12 bg-accent/[0.04] px-4 py-3 text-sm text-stone-400">
            {status}
          </div>
        )}

        {tab === 'orders' ? (
          <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
            <section className="orume-panel max-h-[75vh] overflow-auto rounded-2xl p-3">
              <div className="px-2 pb-3 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-accent/65">
                Pedidos 0000–1000
              </div>
              <div className="space-y-2">
                {visibleOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder({ ...order })}
                    className={'w-full rounded-xl border p-3 text-left transition ' + (completed(order.status) ? 'border-red-900/40 bg-red-950/35 text-red-200' : 'border-accent/10 bg-white/[0.018] hover:border-accent/30')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold">#{order.displayId}</span>
                      <span className="text-[0.62rem] uppercase tracking-[0.1em] opacity-70">{order.status}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold">{order.name || 'Sem cliente'}</p>
                    <div className="mt-2 flex justify-between text-xs text-stone-600">
                      <span>{order.product}</span>
                      <span>{order.amount ? formatBRL(order.amount) : '—'}</span>
                    </div>
                  </button>
                ))}
                {!visibleOrders.length && <p className="p-5 text-center text-sm text-stone-600">Nenhum pedido.</p>}
              </div>
            </section>

            <section className="orume-panel rounded-2xl p-5 sm:p-7">
              {!selectedOrder ? (
                <div className="py-20 text-center text-sm text-stone-600">Selecione um pedido na lista.</div>
              ) : (
                <>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-accent/10 pb-5">
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent/65">Pedido</p>
                      <h2 className="mt-1 font-display text-3xl">#{selectedOrder.displayId}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveOrder} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-black disabled:opacity-40">
                        Salvar
                      </button>
                      <button onClick={completeOrder} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-red-800/50 px-5 py-2.5 text-xs font-bold text-red-300 disabled:opacity-40">
                        <CheckCircleIcon className="h-4 w-4" /> Concluir
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ['Status', 'status'], ['Prioridade', 'priority'], ['Cliente', 'name'], ['WhatsApp', 'phone'],
                      ['Cidade / UF', 'city'], ['CEP', 'cep'], ['Produto', 'product'], ['Quantidade', 'quantity'],
                      ['Cor', 'color'], ['Material', 'material'], ['Prazo', 'deadline'], ['Entrega', 'delivery'],
                      ['Atendimento clean', 'cleanService'], ['Indicado por', 'referral'], ['Valor a cobrar', 'amount'],
                      ['Valor pago', 'paid'], ['Forma de pagamento', 'paymentMethod'], ['Status pagamento', 'paymentStatus'],
                      ['Rastreio', 'tracking'],
                    ].map(([label, key]) => (
                      <label key={key} className="text-xs font-semibold text-stone-500">
                        {label}
                        <input
                          className={inputClass}
                          type={key === 'amount' || key === 'paid' || key === 'quantity' ? 'number' : 'text'}
                          value={String((selectedOrder as unknown as Record<string, unknown>)[key] ?? '')}
                          onChange={(event) =>
                            setSelectedOrder((current) =>
                              current
                                ? ({ ...current, [key]: key === 'amount' || key === 'paid' ? Number(event.target.value) : event.target.value } as Order)
                                : current
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>

                  {[
                    ['Medidas aproximadas', 'dimensions'],
                    ['Links / referências', 'links'],
                    ['Detalhes do projeto', 'description'],
                    ['Observações', 'notes'],
                  ].map(([label, key]) => (
                    <label key={key} className="mt-4 block text-xs font-semibold text-stone-500">
                      {label}
                      <textarea
                        className={inputClass + ' min-h-24 resize-y'}
                        value={String((selectedOrder as unknown as Record<string, unknown>)[key] ?? '')}
                        onChange={(event) => setSelectedOrder((current) => current ? ({ ...current, [key]: event.target.value } as Order) : current)}
                      />
                    </label>
                  ))}
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[350px_1fr]">
            <section className="orume-panel max-h-[75vh] overflow-auto rounded-2xl p-3">
              <button
                onClick={() => setSelectedProduct(emptyProduct())}
                className="mb-3 w-full rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-semibold text-accentLight"
              >
                + Novo produto
              </button>
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct({ ...product })}
                    className="flex w-full gap-3 rounded-xl border border-accent/10 bg-white/[0.018] p-3 text-left transition hover:border-accent/30"
                  >
                    {(product.imageMain || product.detectedImage) ? (
                      <img src={product.imageMain || product.detectedImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-black text-stone-700"><CubeIcon className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-200">{product.name || 'Produto sem nome'}</p>
                      <p className="mt-1 text-xs text-stone-600">{product.price ? formatBRL(product.price) : 'Sem preço'} • {product.active}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="orume-panel rounded-2xl p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-accent/10 pb-5">
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent/65">Produto</p>
                  <h2 className="mt-1 font-display text-3xl">{selectedProduct.id ? selectedProduct.name || 'Editar produto' : 'Novo produto'}</h2>
                </div>
                <button onClick={saveProduct} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-black disabled:opacity-40">
                  Salvar produto
                </button>
              </div>

              <div className="rounded-2xl border border-accent/12 bg-black/30 p-4">
                <label className="text-xs font-semibold text-stone-500">
                  Link do anúncio na Shopee
                  <input
                    className={inputClass}
                    value={selectedProduct.shopeeUrl}
                    onChange={(event) => setSelectedProduct((current) => ({ ...current, shopeeUrl: event.target.value }))}
                    placeholder="https://shopee.com.br/..."
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={scrape}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2.5 text-xs font-bold text-accentLight disabled:opacity-40"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    {selectedProduct.scrapeAttemptAt ? 'Tentar scraping novamente' : 'Tentar scraping'}
                  </button>
                  {selectedProduct.scrapeStatus && <span className="text-xs text-stone-500">{selectedProduct.scrapeStatus}</span>}
                </div>
                {selectedProduct.detectedImage && (
                  <div className="mt-4 flex items-center gap-4 rounded-xl border border-accent/10 bg-white/[0.018] p-3">
                    <img src={selectedProduct.detectedImage} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selectedProduct.detectedTitle || 'Imagem detectada'}</p>
                      <p className="mt-1 text-xs text-accentLight">{selectedProduct.detectedPrice ? formatBRL(selectedProduct.detectedPrice) : 'Preço não detectado'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-semibold text-stone-500">Nome<input className={inputClass} value={selectedProduct.name} onChange={(e) => setSelectedProduct((p) => ({ ...p, name: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-stone-500">SKU<input className={inputClass} value={selectedProduct.sku} onChange={(e) => setSelectedProduct((p) => ({ ...p, sku: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-stone-500">Categoria<input className={inputClass} value={selectedProduct.category} onChange={(e) => setSelectedProduct((p) => ({ ...p, category: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-stone-500">Ativo?
                  <select className={inputClass} value={selectedProduct.active} onChange={(e) => setSelectedProduct((p) => ({ ...p, active: e.target.value }))}><option>Sim</option><option>Não</option></select>
                </label>
                <label className="text-xs font-semibold text-stone-500">Destaque?
                  <select className={inputClass} value={selectedProduct.featured} onChange={(e) => setSelectedProduct((p) => ({ ...p, featured: e.target.value }))}><option>Não</option><option>Sim</option></select>
                </label>
                <label className="text-xs font-semibold text-stone-500">Preço<input type="number" step="0.01" className={inputClass} value={selectedProduct.price} onChange={(e) => setSelectedProduct((p) => ({ ...p, price: Number(e.target.value) }))} /></label>
                <label className="text-xs font-semibold text-stone-500">Preço promocional<input type="number" step="0.01" className={inputClass} value={selectedProduct.salePrice} onChange={(e) => setSelectedProduct((p) => ({ ...p, salePrice: Number(e.target.value) }))} /></label>
                <label className="text-xs font-semibold text-stone-500">Estoque<input type="number" className={inputClass} value={selectedProduct.stock} onChange={(e) => setSelectedProduct((p) => ({ ...p, stock: Number(e.target.value) }))} /></label>
                <label className="text-xs font-semibold text-stone-500">Produção (dias)<input type="number" className={inputClass} value={selectedProduct.productionDays} onChange={(e) => setSelectedProduct((p) => ({ ...p, productionDays: Number(e.target.value) }))} /></label>
              </div>

              <label className="mt-4 block text-xs font-semibold text-stone-500">Descrição<textarea className={inputClass + ' min-h-28 resize-y'} value={selectedProduct.description} onChange={(e) => setSelectedProduct((p) => ({ ...p, description: e.target.value }))} /></label>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {(['imageMain', 'image2', 'image3'] as const).map((key, index) => (
                  <label key={key} className="text-xs font-semibold text-stone-500">
                    {'Imagem ' + (index + 1)}
                    <input className={inputClass} value={selectedProduct[key]} onChange={(e) => setSelectedProduct((p) => ({ ...p, [key]: e.target.value }))} placeholder="https://..." />
                  </label>
                ))}
              </div>

              <label className="mt-4 block text-xs font-semibold text-stone-500">Observações internas<textarea className={inputClass + ' min-h-20 resize-y'} value={selectedProduct.adminNotes} onChange={(e) => setSelectedProduct((p) => ({ ...p, adminNotes: e.target.value }))} /></label>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
