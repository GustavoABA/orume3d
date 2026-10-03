import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

const source = await readFile(new URL('../src/context/CartContext.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;

function mount(t, initial, unavailable = false, affiliate = null) {
  let saved = initial;
  let writes = 0;
  const window = { localStorage: {
    getItem() { if (unavailable) throw new Error('blocked'); return saved; },
    setItem(_key, value) { if (unavailable) throw new Error('blocked'); writes++; if (writes > 10) throw new Error('render loop'); saved = value; },
  } };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: id => {
    if (id.endsWith('/AffiliateContext')) return { useAffiliate: () => affiliate };
    if (id.endsWith('/affiliate')) return { affiliatePrice: (price, rate) => Math.round((price * (100 + rate) / 100 + Number.EPSILON) * 100) / 100 };
    return createRequire(import.meta.url)(id);
  }, window });
  let cart;
  function Consumer() { cart = exports.useCart(); return null; }
  let renderer;
  act(() => { renderer = create(React.createElement(exports.CartProvider, null, React.createElement(Consumer))); });
  t.after(() => act(() => renderer.unmount()));
  return { get cart() { return cart; }, get saved() { return saved; }, get writes() { return writes; } };
}

const product = { id: 5, name: 'Produto teste', price: 80, image: '/brand/orume-mark.webp' };

test('empty cart settles; adding, changing quantity and resetting persist without hydration loops', t => {
  const state = mount(t, null);
  assert.equal(state.cart.totalItems, 0);
  assert.equal(state.writes, 1);
  act(() => state.cart.addToCart(product));
  assert.equal(state.cart.totalItems, 1);
  assert.equal(state.cart.subtotal, 80);
  assert.equal(state.writes, 2);
  act(() => state.cart.updateQuantity(5, 3));
  assert.equal(state.cart.subtotal, 240);
  assert.equal(JSON.parse(state.saved)[0].quantity, 3);
  act(() => state.cart.resetCart());
  assert.deepEqual(JSON.parse(state.saved), []);
  assert.equal(state.writes, 4);
});

test('restores and normalizes an existing cart once without overwriting it with an empty cart', t => {
  const state = mount(t, JSON.stringify([{ ...product, quantity: 2, image: '/orume3d/image.png' }]));
  assert.equal(state.cart.totalItems, 2);
  assert.equal(state.cart.items[0].image, '/image.png');
  assert.equal(JSON.parse(state.saved)[0].quantity, 2);
  assert.equal(state.writes, 1);
  act(() => state.cart.removeFromCart(5));
  assert.equal(state.cart.totalItems, 0);
});

test('corrupt storage starts with a usable empty cart', t => {
  const state = mount(t, '{invalid');
  assert.equal(state.cart.totalItems, 0);
  act(() => state.cart.addToCart(product));
  assert.equal(state.cart.totalItems, 1);
});

test('unavailable storage still permits cart operations', t => {
  const state = mount(t, null, true);
  act(() => state.cart.addToCart(product));
  assert.equal(state.cart.totalItems, 1);
});


test('affiliate cart restores base prices and never compounds the markup', t => {
  const state = mount(t, JSON.stringify([{ ...product, quantity: 2 }]), false, {code:'linux',rate:20});
  assert.equal(state.cart.subtotal,192);
  act(() => state.cart.addToCart({...product,price:96,basePrice:80}));
  assert.equal(state.cart.subtotal,288);
  assert.equal(JSON.parse(state.saved)[0].price,80);
});
test('new affiliate item persists its base, allowing another link or direct visit to reprice', t => {
  const state=mount(t,null,false,{code:'linux',rate:20});
  act(()=>state.cart.addToCart({...product,price:96,basePrice:80}));
  assert.equal(state.cart.items[0].price,96);
  const direct=mount(t,state.saved);assert.equal(direct.cart.items[0].price,80);
  const other=mount(t,state.saved,false,{code:'other',rate:10});assert.equal(other.cart.items[0].price,88);
});
