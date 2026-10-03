import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/backend.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { postBackend } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const endpoint = 'https://script.google.com/macros/s/test/exec';

function setup(t) {
  const originalWindow = globalThis.window;
  globalThis.window = { setTimeout, clearTimeout };
  t.after(() => { globalThis.window = originalWindow; });
}

test('only resolves after a successful JSON response; uses a simple credential-free CORS POST', async t => {
  setup(t);
  const payload = { action: 'createCheckout', checkoutId: 'CHK-test' };
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.equal(url, endpoint);
    assert.equal(options.mode, 'cors');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers['Content-Type'], 'text/plain;charset=utf-8');
    assert.deepEqual(JSON.parse(options.body), payload);
    return new Response(JSON.stringify({ ok: true, checkoutId: 'CHK-test' }));
  });
  assert.equal((await postBackend(endpoint, payload)).checkoutId, 'CHK-test');
  assert.equal(calls, 1);
});

test('preserves backend validation and authorization errors', async t => {
  setup(t);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: false, error: 'Acesso administrativo negado.' })));
  await assert.rejects(postBackend(endpoint, {}), /Acesso administrativo negado/);
});

for (const [name, response] of [
  ['HTTP failure', () => new Response('', { status: 500 })],
  ['Google login HTML', () => new Response('<html>Login</html>')],
  ['missing ok', () => new Response('{}')],
  ['null JSON', () => new Response('null')],
  ['non-boolean ok', () => new Response('{"ok":"true"}')],
]) {
  test(name + ' does not report a saved order', async t => {
    setup(t);
    t.mock.method(globalThis, 'fetch', async () => response());
    await assert.rejects(postBackend(endpoint, {}), /Não foi possível confirmar a gravação/);
  });
}

test('network failure never retries a mutation automatically', async t => {
  setup(t);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new TypeError('Failed to fetch'); });
  await assert.rejects(postBackend(endpoint, {}), /dados podem ter sido recebidos/);
  assert.equal(calls, 1);
});

test('timeout aborts the request and clears its timer', async t => {
  setup(t);
  let abort;
  let cleared = false;
  globalThis.window = { setTimeout(callback) { abort = callback; return 123; }, clearTimeout(id) { assert.equal(id, 123); cleared = true; } };
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    abort();
    assert.equal(options.signal.aborted, true);
    throw new Error('AbortError');
  });
  await assert.rejects(postBackend(endpoint, {}), /Não foi possível confirmar/);
  assert.equal(cleared, true);
});
