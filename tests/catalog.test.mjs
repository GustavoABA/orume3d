import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/catalog.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const product = { id: 1, name: 'Peça', price: 80, image: '/a.jpg', image2: '/b.jpg', image3: '/c.jpg', heightCm: 12.5 };
function setup({ cache, response = async () => ({ ok: true, products: [product] }), blocked = false } = {}) {
  let now = 1_000_000;
  let raw = cache && JSON.stringify(cache);
  let calls = 0;
  const scope = vm.createContext({ exports: {}, Date: { now: () => now }, localStorage: {
    getItem() { if (blocked) throw Error('blocked'); return raw; },
    setItem(_key, value) { if (blocked) throw Error('blocked'); raw = value; },
  }, require(name) {
    assert.equal(name, './backend');
    return { loadBackendConfig: async () => ({ endpoint: '/exec' }), jsonp: async () => { calls++; return response(); } };
  } });
  vm.runInContext(code, scope);
  return { ...scope.exports, advance: ms => { now += ms; }, calls: () => calls, stored: () => JSON.parse(raw) };
}

test('concurrent consumers share one request and preserve photos, dimensions and base prices', async () => {
  let resolve;
  const result = new Promise(r => { resolve = r; });
  const api = setup({ response: () => result });
  const first = api.loadCatalog();
  assert.equal(api.loadCatalog(), first);
  resolve({ ok: true, products: [product] });
  const items = await first;
  assert.equal(api.calls(), 1);
  assert.equal(items[0].images.length, 3);
  assert.equal(items[0].heightCm, 12.5);
  assert.equal(api.stored().products[0].price, 80);
  assert.equal(await api.loadCatalog(), items);
  assert.equal(api.calls(), 1);
});

test('fresh persistent cache avoids network; expired memory reloads', async () => {
  const api = setup({ cache: { savedAt: 999_000, products: [product] } });
  assert.equal((await api.loadCatalog())[0].id, 1);
  assert.equal(api.calls(), 0);
  api.advance(300_001);
  assert.equal(api.getCachedCatalog(), null);
  await api.loadCatalog();
  assert.equal(api.calls(), 1);
});

test('empty server catalog replaces expired products and is reused', async () => {
  const api = setup({ cache: { savedAt: 1, products: [product] }, response: async () => ({ ok: true, products: [] }) });
  assert.equal((await api.loadCatalog()).length, 0);
  assert.equal(api.stored().products.length, 0);
  await api.loadCatalog();
  assert.equal(api.calls(), 1);
});

test('failed requests can retry and do not persist success', async () => {
  let failed = true;
  const api = setup({ response: async () => { if (failed) throw Error('offline'); return { ok: true, products: [product] }; } });
  await assert.rejects(api.loadCatalog(), /offline/);
  assert.equal(api.getCachedCatalog(), null);
  failed = false;
  assert.equal((await api.loadCatalog()).length, 1);
  assert.equal(api.calls(), 2);
});

test('unavailable storage does not prevent loading or memory reuse', async () => {
  const api = setup({ blocked: true });
  await api.loadCatalog();
  await api.loadCatalog();
  assert.equal(api.calls(), 1);
});

test('future or malformed cache and invalid responses are not treated as valid catalogs', async () => {
  for (const cache of [{ savedAt: 2_000_000, products: [product] }, { savedAt: 999_000, products: null }]) {
    const api = setup({ cache, response: async () => ({ ok: false, error: 'Indisponível' }) });
    assert.equal(api.getCachedCatalog(), null);
    await assert.rejects(api.loadCatalog(), /Indisponível/);
    assert.equal(api.getCachedCatalog(), null);
  }
});
