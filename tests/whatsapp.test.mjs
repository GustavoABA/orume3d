import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/whatsapp.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { buildWhatsAppUrl } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
for (const message of ['Olá!', 'ORUME 3D — PEDIDO', 'cod01#445\nQuero esta peça.', 'site da orume', 'Produto A&B + frete?']) {
  test('WhatsApp preserves message and lowercase routing keyword: ' + message, () => {
    const url = new URL(buildWhatsAppUrl(message));
    assert.equal(url.hostname, 'wa.me');
    assert.equal(url.pathname, '/5519989342212');
    assert.ok(url.searchParams.get('text').includes('orume'));
    assert.ok(url.searchParams.get('text').startsWith(message));
    assert.equal([...url.searchParams.keys()].length, 1);
  });
}
test('all frontend WhatsApp URLs go through the routing helper', async () => {
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) await visit(path);
      else if (/\.(tsx?|html|js)$/.test(entry.name) && !path.pathname.endsWith('/lib/whatsapp.ts')) {
        assert.doesNotMatch(await readFile(path, 'utf8'), /(?:wa\.me|(?:api|web)\.whatsapp\.com)/, path.pathname);
      }
    }
  }
  await visit(new URL('../src/', import.meta.url));
  await visit(new URL('../public/', import.meta.url));
});
