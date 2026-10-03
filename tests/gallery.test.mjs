import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const modules = {};
for (const name of ['ProductImage', 'ProductGallery']) {
  const source = await readFile(new URL(`../src/components/shop/${name}.tsx`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => id === './ProductImage' ? modules.ProductImage : require(id) });
  modules[name] = exports;
}
const Gallery = modules.ProductGallery.default;
const props = { name: 'Peça Orume', image: '/one.png', images: ['/one.png', '/two.png', '/three.png'] };
function mount(t, input = props) {
  let renderer;
  act(() => { renderer = create(React.createElement(Gallery, { key: 'first', ...input })); });
  t.after(() => act(() => renderer.unmount()));
  return renderer;
}
const main = renderer => renderer.root.findAllByType('img')[0];
const button = (renderer, label) => renderer.root.findByProps({ 'aria-label': label });

test('shows all three distinct photos and navigates thumbnails, arrows and keyboard', t => {
  const r = mount(t);
  assert.equal(r.root.findAllByType('img').length, 4);
  assert.equal(main(r).props.src, '/one.png');
  act(() => button(r, 'Ver foto 3 de Peça Orume').props.onClick());
  assert.equal(main(r).props.src, '/three.png');
  assert.equal(button(r, 'Ver foto 3 de Peça Orume').props['aria-pressed'], true);
  act(() => button(r, 'Próxima foto').props.onClick());
  assert.equal(main(r).props.src, '/one.png');
  act(() => button(r, 'Foto anterior').props.onClick());
  assert.equal(main(r).props.src, '/three.png');
  act(() => r.root.findByProps({ tabIndex: 0 }).props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} }));
  assert.equal(main(r).props.src, '/two.png');
});

test('horizontal swipe changes photo; vertical scrolling leaves it unchanged', t => {
  const r = mount(t);
  const area = () => r.root.findByProps({ tabIndex: 0 });
  act(() => { area().props.onTouchStart({ touches: [{ clientX: 100, clientY: 0 }] }); area().props.onTouchEnd({ changedTouches: [{ clientX: 0, clientY: 10 }] }); });
  assert.equal(main(r).props.src, '/two.png');
  act(() => { area().props.onTouchStart({ touches: [{ clientX: 100, clientY: 0 }] }); area().props.onTouchEnd({ changedTouches: [{ clientX: 90, clientY: 100 }] }); });
  assert.equal(main(r).props.src, '/two.png');
});

test('failed photo gets a fallback without preventing navigation to the next photo', t => {
  const r = mount(t);
  act(() => main(r).props.onError());
  assert.equal(main(r).props.src, '/brand/orume-mark.webp');
  act(() => button(r, 'Próxima foto').props.onClick());
  assert.equal(main(r).props.src, '/two.png');
});

test('changing products resets the selected image', t => {
  const r = mount(t);
  act(() => button(r, 'Ver foto 3 de Peça Orume').props.onClick());
  act(() => r.update(React.createElement(Gallery, { key: 'second', ...props, image: '/other.png', images: ['/other.png', '/two.png'] })));
  assert.equal(main(r).props.src, '/other.png');
});

test('single or missing image does not show unnecessary navigation', t => {
  const r = mount(t, { name: 'Sem foto', image: '', images: [] });
  assert.equal(main(r).props.src, '/brand/orume-mark.webp');
  assert.equal(r.root.findAllByType('button').length, 0);
});
