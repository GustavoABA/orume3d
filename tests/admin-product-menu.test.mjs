import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { create, act } from 'react-test-renderer';

const require = createRequire(import.meta.url);
const source = await readFile(new URL('../src/pages/Admin.tsx', import.meta.url), 'utf8');

test('menu de produtos abre junto ao botão ou clique direito e bloqueia exclusão em backend antigo', async () => {
  const posts = [];
  const product = { id: 7, name: 'Produto de teste', source: 'Interno', price: 80, active: 'Sim', stock: 0 };
  const backend = {
    loadBackendConfig: async () => ({ endpoint: 'test' }),
    jsonp: async (_endpoint, params) => params.action === 'ping'
      ? { ok: true, version: 5 }
      : { ok: true, products: [product], orders: [], affiliates: [] },
    postBackend: async (_endpoint, payload) => { posts.push(payload); return { ok: true }; },
  };
  const module = { exports: {} };
  const browser = { innerWidth: 1645, innerHeight: 896, confirm: () => true };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    window: browser,
    sessionStorage: { getItem: () => 'test', removeItem: () => {} },
    require: name => name === '../lib/backend' ? backend
      : name === '../lib/format' ? { formatBRL: String }
      : name.startsWith('../components/') ? { default: () => null }
      : require(name),
  });

  let view;
  await act(async () => { view = create(React.createElement(module.exports.default)); });
  const menu = () => view.root.findAllByType('div').find(node =>
    typeof node.props.className === 'string' && node.props.className.includes('fixed z-50 w-52'));
  const more = view.root.findAllByType('button').find(node => node.props['aria-label'] === 'Mais ações para Produto de teste');
  assert.ok(more, 'o botão de ações deve existir');

  const target = { getBoundingClientRect: () => ({ right: 493, bottom: 430 }) };
  await act(async () => more.props.onClick({ currentTarget: target }));
  assert.equal(menu().props.style.left, 285);
  assert.equal(menu().props.style.top, 436);

  const row = view.root.findAllByType('button').find(node => typeof node.props.onContextMenu === 'function');
  await act(async () => row.props.onContextMenu({
    preventDefault() {},
    currentTarget: target,
    clientX: 300,
    clientY: 470,
  }));
  assert.equal(menu().props.style.left, 300);
  assert.equal(menu().props.style.top, 470);

  const deleteButton = view.root.findAllByType('button').find(node => node.children.join('') === 'Excluir produto');
  await act(async () => { deleteButton.props.onClick(); });
  assert.equal(posts.length, 0, 'backend antigo não deve receber exclusão desconhecida');
  assert.match(JSON.stringify(view.toJSON()), /Google Apps Script publicado está desatualizado/);
  await act(async () => { view.unmount(); });
});
