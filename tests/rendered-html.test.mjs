import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

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

  const instagramLinks = await readFile(path.join(docsDir, "instagram", "links.js"), "utf8");
  const instagramLinksJson = JSON.parse(await readFile(path.join(docsDir, "instagram", "links.json"), "utf8"));
  assert.match(instagramLinks, /api\.allorigins\.win\/raw/i);
  assert.match(instagramLinks, /orume:instagram-links/i);
  assert.equal(instagramLinksJson.length, 9);
  assert.ok(instagramLinksJson.every((link) => typeof link === "string"));
  assert.match(instagramLinksJson[0], /instagram\.com\/p\/DdOJLGjFn9k/i);
});

test("extrai links de posts do HTML recebido pelo proxy", async () => {
  const source = await readFile(path.resolve("public", "instagram", "links.js"), "utf8");
  const events = [];
  const window = {
    dispatchEvent(event) { events.push(event); },
    setTimeout,
    clearTimeout,
  };
  const context = {
    AbortController,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    fetch: async (url) => {
      if (url === "./instagram/links.json") {
        return {
          ok: true,
          json: async () => [
            "https://www.instagram.com/p/DdOJLGjFn9k/?utm_source=teste",
            "https://www.instagram.com/p/DdJzJhTDqt0/",
          ],
        };
      }
      throw new Error("proxy indisponivel no teste");
    },
    window,
  };

  vm.runInNewContext(source, context);
  const extracted = window.OrumeInstagramLinks.extract(
    String.raw`href=\"https:\/\/www.instagram.com\/p\/Projeto123\/\" e \/reel\/Reel_456\/`,
  );

  assert.deepEqual(Array.from(extracted), [
    "https://www.instagram.com/p/Projeto123/",
    "https://www.instagram.com/reel/Reel_456/",
  ]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(Array.from(window.OrumeInstagramLinks.links), [
    "https://www.instagram.com/p/DdOJLGjFn9k/",
    "https://www.instagram.com/p/DdJzJhTDqt0/",
  ]);
  assert.ok(events.some((event) => event.type === "orume:instagram-links"));
});
