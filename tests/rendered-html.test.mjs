import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

async function render() {
  const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${basePath}/`, {
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
  assert.match(html, /orume-logo-mark\.webp/i);
  assert.match(html, /service-triptych\.webp/i);
  assert.match(html, /gostaria%20de%20criar%20uma%20pe%C3%A7a%20personalizada/i);
  assert.match(html, /gostaria%20de%20encomendar%20um%20presente/i);
  assert.match(html, /preciso%20desenvolver%20um%20prot%C3%B3tipo/i);
  assert.match(html, /wa\.me\/5519989342212/i);
  assert.match(html, /instagram\.com\/orume3d/i);
  assert.match(html, /tiktok\.com\/@orume3d/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("exporta todos os arquivos do GitHub Pages no caminho correto", async () => {
  const docsDir = path.resolve("docs");
  const html = await readFile(path.join(docsDir, "index.html"), "utf8");
  const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";

  assert.doesNotMatch(html, /["']\/_next\/static\//i);
  await access(path.join(docsDir, "404.html"));
  await access(path.join(docsDir, ".nojekyll"));

  const references = [
    ...html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g),
  ].map((match) => match[1]);

  assert.ok(references.length >= 5, "A página deve carregar seus arquivos de estilo e interação.");

  for (const reference of new Set(references)) {
    const pathname = reference.startsWith("http")
      ? new URL(reference).pathname
      : new URL(reference, "https://example.test" + (basePath || "/") + "/").pathname;
    const relativePath = basePath && pathname.startsWith(basePath + "/")
      ? pathname.slice(basePath.length + 1)
      : pathname.replace(/^\/+/, "");
    const assetPath = path.resolve(docsDir, decodeURIComponent(relativePath));

    assert.ok(assetPath.startsWith(docsDir + path.sep), `Caminho inseguro no HTML: ${reference}`);
    await access(assetPath);
  }

  const liveConfig = JSON.parse(await readFile(path.resolve("public", "live.json"), "utf8"));
  assert.equal(typeof liveConfig.active, "boolean");
});
