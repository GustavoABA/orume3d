import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = 'https://orume.com.br';
const CONFIG_PATH = path.resolve('public/intake-config.json');
const TEMPLATE_PATH = path.resolve('dist/index.html');
const DIST_DIR = path.resolve('dist');
const MAX_RETRIES = 3;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const plainText = (value, max = 180) => {
  const clean = String(value ?? '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_#>~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
};

const absoluteUrl = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    return new URL(raw, SITE_URL).href;
  } catch {
    return '';
  }
};

const replaceTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

const replaceMeta = (html, attribute, key, value) => {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const replaceCanonical = (html, href) => {
  const pattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const replaceAlternate = (html, href) => {
  const pattern = /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']pt-BR["'][^>]*>/i;
  const tag = `<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const formatPrice = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const fetchCatalog = async (endpoint) => {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const url = new URL(endpoint);
      url.searchParams.set('action', 'catalog');
      url.searchParams.set('_', String(Date.now()));
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data?.ok || !Array.isArray(data.products)) throw new Error(data?.error || 'Resposta de catálogo inválida');
      return data.products;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Falha ao carregar catálogo');
};

const productHtml = (template, product) => {
  const id = Number(product.id);
  const url = `${SITE_URL}/produto/${id}/`;
  const title = `${plainText(product.name, 80)} | Orume 3D`;
  const description = plainText(product.description, 155) || `${plainText(product.name, 90)} impresso em 3D por encomenda na Orume 3D.`;
  const images = Array.from(
    new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].map(absoluteUrl).filter(Boolean))
  );
  const image = images[0] || `${SITE_URL}/brand/orume-workbench.webp`;
  const price = Number(product.price || 0);

  let html = replaceTitle(template, title);
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'name', 'robots', 'index, follow, max-image-preview:large');
  html = replaceCanonical(html, url);
  html = replaceAlternate(html, url);
  html = replaceMeta(html, 'property', 'og:type', 'product');
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:image', image);
  html = replaceMeta(html, 'property', 'og:image:alt', plainText(product.name, 120));
  html = replaceMeta(html, 'property', 'product:price:amount', price.toFixed(2));
  html = replaceMeta(html, 'property', 'product:price:currency', 'BRL');
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', image);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: String(product.name || ''),
    description,
    url,
    image: images.length ? images : [image],
    category: String(product.category || ''),
    brand: { '@type': 'Brand', name: 'Orume 3D' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: price.toFixed(2),
      seller: { '@type': 'Organization', name: 'Orume 3D' },
    },
  };
  if (product.sku) schema.sku = String(product.sku);

  const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
  html = html.replace('</head>', `    <script type="application/ld+json">${jsonLd}</script>\n  </head>`);

  const fallback = `<main data-product-snapshot="${id}" style="max-width:960px;margin:0 auto;padding:32px 20px;font-family:system-ui,sans-serif;color:#f5f5f4;background:#050504"><article><p style="opacity:.7">Orume 3D · Impressão 3D por encomenda</p><h1>${escapeHtml(product.name)}</h1><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" style="max-width:100%;height:auto;border-radius:16px"/><p style="font-size:1.25rem;font-weight:700">${escapeHtml(formatPrice(price))}</p><p>${escapeHtml(description)}</p><p><a href="/" style="color:#d6b36a">Ver catálogo da Orume 3D</a></p></article></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);

  return html;
};

const buildSitemap = (products) => {
  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...products.map((product) =>
      `  <url>\n    <loc>${SITE_URL}/produto/${Number(product.id)}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
};

const main = async () => {
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const endpoint = String(config.endpoint || '').trim();
  if (!endpoint) throw new Error('Endpoint ausente em public/intake-config.json');

  const template = await readFile(TEMPLATE_PATH, 'utf8');
  const rawProducts = await fetchCatalog(endpoint);
  const products = rawProducts
    .filter((product) => Number.isInteger(Number(product.id)) && Number(product.id) > 0 && String(product.name || '').trim())
    .sort((a, b) => Number(a.id) - Number(b.id));

  if (!products.length) throw new Error('O catálogo público não retornou produtos ativos; o deploy foi interrompido para preservar as rotas existentes.');

  for (const product of products) {
    const dir = path.join(DIST_DIR, 'produto', String(Number(product.id)));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), productHtml(template, product), 'utf8');
  }

  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), buildSitemap(products), 'utf8');
  console.log(`SEO: ${products.length} rotas de produto e sitemap gerados a partir da planilha.`);
};

main().catch((error) => {
  console.error('Falha ao gerar rotas de produto:', error);
  process.exitCode = 1;
});
