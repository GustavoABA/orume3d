import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, CubeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { loadBackendConfig, jsonp, postBackend } from '../lib/backend';
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

type ProductSource = 'Shopee' | 'Interno' | '';

type Product = {
  source: ProductSource;
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
  source: '',
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

const normalizeProductSource = (product: Product): Product => ({
  ...product,
  source: product.source || (product.shopeeUrl?.trim() ? 'Shopee' : 'Interno'),
});

const isLightshotUrl = (value: string) =>
  /^https?:\/\/(?:www\.)?prnt\.sc\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/i.test(value.trim());

const resolveLightshotImage = async (value: string): Promise<string> => {
  const url = value.trim();
  if (!isLightshotUrl(url)) return url;

  const response = await fetch(
    'https://api.microlink.io/?url=' +
      encodeURIComponent(url) +
      '&meta.image=true&meta.logo=false&meta.title=false&meta.description=false'
  );

  if (!response.ok) {
    throw new Error('Não foi possível resolver o link do Lightshot.');
  }

  const result = (await response.json()) as {
    status?: string;
    data?: { image?: { url?: string } | string | null };
  };

  const image =
    typeof result.data?.image === 'string'
      ? result.data.image
      : String(result.data?.image?.url || '').trim();

  if (!image) {
    throw new Error('O Lightshot não expôs uma imagem utilizável para este link.');
  }

  return image;
};

const resolveProductImages = async (product: Product): Promise<Product> => ({
  ...product,
  imageMain: await resolveLightshotImage(product.imageMain),
  image2: await resolveLightshotImage(product.image2),
  image3: await resolveLightshotImage(product.image3),
});

const inputClass =
  'mt-1.5 w-full rounded-xl border border-accent/[0.12] bg-surface/[0.85] px-3.5 py-2.5 text-sm text-paper outline-none transition placeholder:text-muted/[0.55] focus:border-accent/40 focus:ring-2 focus:ring-accent/10';

const Admin = () => {
  const [endpoint, setEndpoint] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('orume:adminKey') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(emptyProduct());
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [tab, setTab] = useState<'orders' | 'products'>('products');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const completed = (value: string) => value === 'Concluído' || value === 'Cancelado';

  const startNewProduct = () => {
    setSelectedProduct(emptyProduct());
    setIsCreatingProduct(true);
    setStatus('Novo produto: será criado em uma nova linha ao salvar.');
  };

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
    const normalizedProducts = (data.products || []).map(normalizeProductSource);
    setProducts(normalizedProducts);
    if (selectedOrder) {
      const fresh = (data.orders || []).find((item) => item.id === selectedOrder.id);
      if (fresh) setSelectedOrder(fresh);
    }
    if (selectedProduct.id) {
      const fresh = normalizedProducts.find((item) => item.id === selectedProduct.id);
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
      await postBackend(endpoint, {
        action: 'adminSaveOrder',
        adminKey,
        order: selectedOrder,
      });
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
      await postBackend(endpoint, {
        action: 'adminCompleteOrder',
        adminKey,
        id: selectedOrder.id,
      });
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
    if (!selectedProduct.source) {
      setStatus('Escolha se o produto é da Shopee ou interno.');
      return;
    }
    if (!selectedProduct.name.trim()) {
      setStatus('Informe o nome do produto.');
      return;
    }
    if (selectedProduct.source === 'Shopee' && !selectedProduct.shopeeUrl.trim()) {
      setStatus('Produto da Shopee precisa do link do anúncio.');
      return;
    }

    setBusy(true);

    try {
      const hasLightshot = [selectedProduct.imageMain, selectedProduct.image2, selectedProduct.image3]
        .some((url) => isLightshotUrl(url));

      if (hasLightshot) {
        setStatus('Resolvendo links do Lightshot…');
      }

      const resolvedProduct = await resolveProductImages(selectedProduct);

      const baseProduct: Product = isCreatingProduct
        ? { ...resolvedProduct, id: 0 }
        : resolvedProduct;

      const productToSave: Product =
        baseProduct.source === 'Interno'
          ? {
              ...baseProduct,
              shopeeUrl: '',
              scrapeStatus: '',
              scrapeAttemptAt: '',
              detectedTitle: '',
              detectedPrice: 0,
              detectedImage: '',
            }
          : baseProduct;

      setSelectedProduct(productToSave);
      setStatus('Salvando produto…');

      const result = await postBackend<{ ok: boolean; error?: string; product: Product }>(endpoint, {
        action: 'adminSaveProduct',
        adminKey,
        mode: isCreatingProduct ? 'create' : 'update',
        product: productToSave,
      });

      setSelectedProduct(result.product);
      setIsCreatingProduct(false);
      await getSnapshot(adminKey);
      setStatus(
        isCreatingProduct
          ? 'Produto criado em uma nova linha do catálogo.'
          : 'Alterações do produto salvas.'
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar produto.');
    } finally {
      setBusy(false);
    }
  };

    const visibleOrders = useMemo(() => orders.slice(0, 250), [orders]);
  const activeProducts = useMemo(
    () => products.filter((product) => product.active === 'Sim'),
    [products]
  );
  const readyProducts = useMemo(
    () => activeProducts.filter((product) => Number(product.stock || 0) > 0),
    [activeProducts]
  );
  const madeToOrderProducts = useMemo(
    () => activeProducts.filter((product) => Number(product.stock || 0) <= 0),
    [activeProducts]
  );

  if (!adminKey) {
    return (
      <main className="min-h-screen bg-background px-5 py-16 text-paper">
        <form onSubmit={login} className="orume-panel mx-auto max-w-md rounded-3xl p-7">
          <img src="/brand/orume-mark.webp" alt="" className="mx-auto h-14 w-14 object-contain" />
          <p className="mt-5 text-center text-[0.6rem] font-bold uppercase tracking-[0.3em] text-accent/70">
            Administração Orume
          </p>
          <h1 className="mt-2 text-center font-display text-3xl">Acesso privado</h1>
          <p className="mt-3 text-center text-sm leading-6 text-muted">
            Use a chave configurada no Apps Script. Ela fica apenas nesta sessão do navegador.
          </p>
          <label className="mt-6 block text-xs font-semibold text-paper/70">
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
            className="mt-5 w-full rounded-full bg-accent px-5 py-3 text-sm font-bold text-ink shadow-glow disabled:opacity-50"
          >
            Entrar
          </button>
          {status && <p className="mt-4 text-center text-xs leading-5 text-muted">{status}</p>}
          <a href="/" className="mt-5 block text-center text-xs text-muted/70 hover:text-accentLight">
            ← Voltar para a loja
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-paper">
      <header className="sticky top-0 z-30 border-b border-accent/[0.12] bg-ink/[0.94] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/brand/orume-mark.webp" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="orume-metal-text font-display text-xl tracking-[0.16em]">ORUME ADMIN</p>
              <p className="text-[0.55rem] uppercase tracking-[0.22em] text-muted/70">backend operacional</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI/edit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-accent/[0.15] px-4 py-2 text-xs text-paper/70 hover:border-accent/40 hover:text-accentLight"
            >
              Planilha <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-accent/[0.15] px-4 py-2 text-xs text-paper/70 hover:border-accent/40 hover:text-accentLight disabled:opacity-40"
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
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab('products')}
              className={'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] ' + (tab === 'products' ? 'bg-accent text-ink' : 'border border-accent/[0.15] text-paper/70')}
            >
              <CubeIcon className="h-4 w-4" /> Produtos
            </button>
            <button
              onClick={() => setTab('orders')}
              className={'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] ' + (tab === 'orders' ? 'bg-accent text-ink' : 'border border-accent/[0.15] text-paper/70')}
            >
              <ShoppingBagIcon className="h-4 w-4" /> Pedidos
            </button>
          </div>

          {tab === 'products' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-accent/10 bg-paper/[0.025] p-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted/60">Produtos ativos</p>
                <strong className="mt-1 block text-2xl text-paper">{activeProducts.length}</strong>
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-emerald-300/70">Pronta entrega</p>
                <strong className="mt-1 block text-2xl text-emerald-200">{readyProducts.length}</strong>
              </div>
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.045] p-4">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-amber-300/70">Sob demanda</p>
                <strong className="mt-1 block text-2xl text-amber-200">{madeToOrderProducts.length}</strong>
              </div>
            </div>
          )}
        </div>

        {status && (
          <div className="mb-5 rounded-2xl border border-accent/[0.12] bg-accent/[0.04] px-4 py-3 text-sm text-paper/70">
            {status}
          </div>
        )}

        {tab === 'orders' ? (
          <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
            <section className="orume-panel max-h-[75vh] overflow-auto rounded-2xl p-3">
              <div className="px-2 pb-3 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-accent/[0.65]">
                Pedidos 0000–1000
              </div>
              <div className="space-y-2">
                {visibleOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder({ ...order })}
                    className={'w-full rounded-xl border p-3 text-left transition ' + (completed(order.status) ? 'border-red-900/40 bg-red-950/35 text-red-200' : 'border-accent/10 bg-paper/[0.03] hover:border-accent/30')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold">#{order.displayId}</span>
                      <span className="text-[0.62rem] uppercase tracking-[0.1em] opacity-70">{order.status}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold">{order.name || 'Sem cliente'}</p>
                    <div className="mt-2 flex justify-between text-xs text-muted/70">
                      <span>{order.product}</span>
                      <span>{order.amount ? formatBRL(order.amount) : '—'}</span>
                    </div>
                  </button>
                ))}
                {!visibleOrders.length && <p className="p-5 text-center text-sm text-muted/70">Nenhum pedido.</p>}
              </div>
            </section>

            <section className="orume-panel rounded-2xl p-5 sm:p-7">
              {!selectedOrder ? (
                <div className="py-20 text-center text-sm text-muted/70">Selecione um pedido na lista.</div>
              ) : (
                <>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-accent/10 pb-5">
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent/[0.65]">Pedido</p>
                      <h2 className="mt-1 font-display text-3xl">#{selectedOrder.displayId}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveOrder} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-ink disabled:opacity-40">
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
                      <label key={key} className="text-xs font-semibold text-muted">
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
                    <label key={key} className="mt-4 block text-xs font-semibold text-muted">
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
                onClick={startNewProduct}
                className="mb-3 w-full rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-semibold text-accentLight"
              >
                + Novo produto
              </button>
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(normalizeProductSource({ ...product }));
                      setIsCreatingProduct(false);
                      setStatus('');
                    }}
                    className="flex w-full gap-3 rounded-xl border border-accent/10 bg-paper/[0.03] p-3 text-left transition hover:border-accent/30"
                  >
                    {(product.imageMain || product.detectedImage) ? (
                      <img
                        src={product.imageMain || product.detectedImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.src = '/brand/orume-mark.webp';
                          event.currentTarget.classList.remove('object-cover');
                          event.currentTarget.classList.add('object-contain', 'p-2');
                        }}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-muted/[0.55]"><CubeIcon className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-paper/90">{product.name || 'Produto sem nome'}</p>
                      <p className="mt-1 text-xs text-muted/70">{product.price ? formatBRL(product.price) : 'Sem preço'} • {product.active}</p>
                      <span className="mt-2 mr-2 inline-flex rounded-full border border-accent/15 bg-accent/[0.05] px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-accentLight">
                        {product.source === 'Shopee' ? 'Shopee' : 'Interno'}
                      </span>
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.1em] ${
                        Number(product.stock || 0) <= 0
                          ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200'
                          : 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200'
                      }`}>
                        {Number(product.stock || 0) <= 0
                          ? 'Sob demanda'
                          : `${product.stock} pronta${Number(product.stock) === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="orume-panel rounded-2xl p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-accent/10 pb-5">
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent/[0.65]">Produto</p>
                  <h2 className="mt-1 font-display text-3xl">
                    {isCreatingProduct ? 'Novo produto' : selectedProduct.name || 'Selecione um produto'}
                  </h2>
                  {selectedProduct.id > 0 && (
                    <p className="mt-1 font-mono text-[0.62rem] text-muted/60">ID #{selectedProduct.id}</p>
                  )}
                  {selectedProduct.source && (
                    <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-accent/70">
                      {selectedProduct.source === 'Shopee' ? 'Produto Shopee' : 'Produto interno'}
                    </p>
                  )}
                  <p className={`mt-2 text-xs font-semibold ${
                    Number(selectedProduct.stock || 0) <= 0 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {Number(selectedProduct.stock || 0) <= 0
                      ? 'Produzido sob demanda • compra direta pelo WhatsApp'
                      : `Pronta entrega • ${selectedProduct.stock} em estoque`}
                  </p>
                </div>
                <button onClick={saveProduct} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-ink disabled:opacity-40">
                  {isCreatingProduct ? 'Criar produto' : 'Salvar alterações'}
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-accent/[0.12] bg-surface/[0.55] p-4">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent/70">
                  Origem do produto
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct((current) => ({
                        ...current,
                        source: 'Shopee',
                      }))
                    }
                    className={
                      'rounded-2xl border px-4 py-4 text-left transition ' +
                      (selectedProduct.source === 'Shopee'
                        ? 'border-accent/45 bg-accent/10 text-accentLight'
                        : 'border-accent/10 bg-paper/[0.02] text-paper/70 hover:border-accent/25')
                    }
                  >
                    <strong className="block text-sm">Shopee</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted/70">
                      Pede o link do anúncio e libera tentativa de scraping.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct((current) => ({
                        ...current,
                        source: 'Interno',
                        shopeeUrl: '',
                        scrapeStatus: '',
                        scrapeAttemptAt: '',
                        detectedTitle: '',
                        detectedPrice: 0,
                        detectedImage: '',
                      }))
                    }
                    className={
                      'rounded-2xl border px-4 py-4 text-left transition ' +
                      (selectedProduct.source === 'Interno'
                        ? 'border-accent/45 bg-accent/10 text-accentLight'
                        : 'border-accent/10 bg-paper/[0.02] text-paper/70 hover:border-accent/25')
                    }
                  >
                    <strong className="block text-sm">Produto interno</strong>
                    <span className="mt-1 block text-xs leading-5 text-muted/70">
                      Não exige Shopee. O produto é vendido diretamente pela Orume.
                    </span>
                  </button>
                </div>
              </div>

              {selectedProduct.source === 'Shopee' && (
                <div className="rounded-2xl border border-accent/[0.12] bg-surface/[0.65] p-4">
                <label className="text-xs font-semibold text-muted">
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
                {selectedProduct.scrapeStatus && <span className="text-xs text-muted">{selectedProduct.scrapeStatus}</span>}
                </div>
                {selectedProduct.detectedImage && (
                <div className="mt-4 flex items-center gap-4 rounded-xl border border-accent/10 bg-paper/[0.03] p-3">
                <img src={selectedProduct.detectedImage} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedProduct.detectedTitle || 'Imagem detectada'}</p>
                <p className="mt-1 text-xs text-accentLight">{selectedProduct.detectedPrice ? formatBRL(selectedProduct.detectedPrice) : 'Preço não detectado'}</p>
                </div>
                </div>
                )}
                </div>
              )}

              {selectedProduct.source === 'Interno' && (
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-4">
                  <p className="text-sm font-semibold text-emerald-200">Produto interno Orume</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-100/60">
                    Cadastre nome, preço, estoque, prazo, descrição e imagens abaixo. Nenhum link da Shopee será solicitado.
                    No checkout, o WhatsApp identifica este item como produto interno.
                  </p>
                </div>
              )}


              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-semibold text-muted">Nome<input className={inputClass} value={selectedProduct.name} onChange={(e) => setSelectedProduct((p) => ({ ...p, name: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-muted">SKU<input className={inputClass} value={selectedProduct.sku} onChange={(e) => setSelectedProduct((p) => ({ ...p, sku: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-muted">Categoria<input className={inputClass} value={selectedProduct.category} onChange={(e) => setSelectedProduct((p) => ({ ...p, category: e.target.value }))} /></label>
                <label className="text-xs font-semibold text-muted">Ativo?
                  <select className={inputClass} value={selectedProduct.active} onChange={(e) => setSelectedProduct((p) => ({ ...p, active: e.target.value }))}><option>Sim</option><option>Não</option></select>
                </label>
                <label className="text-xs font-semibold text-muted">Destaque?
                  <select className={inputClass} value={selectedProduct.featured} onChange={(e) => setSelectedProduct((p) => ({ ...p, featured: e.target.value }))}><option>Não</option><option>Sim</option></select>
                </label>
                <label className="text-xs font-semibold text-muted">Preço<input type="number" step="0.01" className={inputClass} value={selectedProduct.price} onChange={(e) => setSelectedProduct((p) => ({ ...p, price: Number(e.target.value) }))} /></label>
                <label className="text-xs font-semibold text-muted">Preço promocional<input type="number" step="0.01" className={inputClass} value={selectedProduct.salePrice} onChange={(e) => setSelectedProduct((p) => ({ ...p, salePrice: Number(e.target.value) }))} /></label>
                <label className="text-xs font-semibold text-muted">
                  Estoque
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={selectedProduct.stock}
                    onChange={(e) => setSelectedProduct((p) => ({ ...p, stock: Math.max(0, Number(e.target.value)) }))}
                  />
                  <span className={`mt-2 block text-[0.68rem] leading-5 ${
                    Number(selectedProduct.stock || 0) <= 0 ? 'text-amber-300/80' : 'text-emerald-300/80'
                  }`}>
                    {Number(selectedProduct.stock || 0) <= 0
                      ? '0 = Produzido sob demanda. No site, Comprar abre o WhatsApp direto.'
                      : 'Com estoque = pronta entrega e pode ser adicionado ao carrinho.'}
                  </span>
                </label>
                <label className="text-xs font-semibold text-muted">
                  Produção (dias)
                  <input type="number" min="0" className={inputClass} value={selectedProduct.productionDays} onChange={(e) => setSelectedProduct((p) => ({ ...p, productionDays: Math.max(0, Number(e.target.value)) }))} />
                  <span className="mt-2 block text-[0.68rem] leading-5 text-muted/60">
                    Usado principalmente para itens sob demanda.
                  </span>
                </label>
              </div>

              <label className="mt-4 block text-xs font-semibold text-muted">Descrição<textarea className={inputClass + ' min-h-28 resize-y'} value={selectedProduct.description} onChange={(e) => setSelectedProduct((p) => ({ ...p, description: e.target.value }))} /></label>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted">Imagens do produto</p>
                <p className="mt-1 text-[0.68rem] leading-5 text-muted/60">
                  Aceita URL direta ou link prnt.sc. Links do Lightshot são convertidos automaticamente para a imagem real ao salvar. A primeira imagem é usada no card principal.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  {(['imageMain', 'image2', 'image3'] as const).map((key, index) => (
                    <div key={key} className="rounded-xl border border-accent/10 bg-paper/[0.02] p-3">
                      <label className="text-xs font-semibold text-muted">
                        {'Imagem ' + (index + 1)}
                        <input
                          className={inputClass}
                          value={selectedProduct[key]}
                          onChange={(e) => setSelectedProduct((p) => ({ ...p, [key]: e.target.value.trim() }))}
                          placeholder="https://... ou https://prnt.sc/..."
                        />
                      </label>

                      {isLightshotUrl(selectedProduct[key]) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            setStatus('Resolvendo imagem do Lightshot…');
                            try {
                              const resolved = await resolveLightshotImage(selectedProduct[key]);
                              setSelectedProduct((current) => ({ ...current, [key]: resolved }));
                              setStatus('Link do Lightshot convertido para imagem direta.');
                            } catch (error) {
                              setStatus(error instanceof Error ? error.message : 'Falha ao resolver Lightshot.');
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="mt-2 w-full rounded-lg border border-accent/20 bg-accent/[0.06] px-3 py-2 text-[0.68rem] font-bold text-accentLight transition hover:bg-accent/10 disabled:opacity-40"
                        >
                          Resolver imagem do Lightshot
                        </button>
                      )}

                      {selectedProduct[key] && !isLightshotUrl(selectedProduct[key]) && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-accent/10 bg-ink">
                          <img
                            src={selectedProduct[key]}
                            alt={`Prévia da imagem ${index + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-28 w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                              const warning = event.currentTarget.nextElementSibling as HTMLElement | null;
                              if (warning) warning.style.display = 'block';
                            }}
                          />
                          <p className="hidden p-3 text-[0.68rem] leading-5 text-amber-300">
                            Não foi possível carregar esta URL como imagem.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-4 block text-xs font-semibold text-muted">Observações internas<textarea className={inputClass + ' min-h-20 resize-y'} value={selectedProduct.adminNotes} onChange={(e) => setSelectedProduct((p) => ({ ...p, adminNotes: e.target.value }))} /></label>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
