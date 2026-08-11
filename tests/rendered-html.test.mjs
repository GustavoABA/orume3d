import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renderiza a landing page da Orume 3D", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="pt-BR"/i);
  assert.match(html, /Orume 3D \| Ideias que ganham forma/i);
  assert.match(html, /Você imagina\./i);
  assert.match(html, /A gente imprime\./i);
  assert.match(html, /Abrir Instagram/i);
  assert.match(html, /Santa Cruz da Conceição/i);
  assert.match(html, /Abrir contrato completo/i);
  assert.match(html, /Todos os orçamentos e fechamentos são realizados pelo WhatsApp/i);
  assert.match(html, /wa\.me\/5519989342212/i);
  assert.match(html, /instagram\.com\/orume3d/i);
  assert.match(html, /tiktok\.com\/@orume3d/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});
