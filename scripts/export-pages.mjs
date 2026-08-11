import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distClient = path.resolve(root, "dist", "client");
const docsDir = path.resolve(root, "docs");
const configuredBasePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";
const basePath = configuredBasePath
  ? "/" + configuredBasePath.replace(/^\/+|\/+$/g, "")
  : "";

if (!docsDir.startsWith(root + path.sep)) {
  throw new Error("Destino de exportação fora do projeto.");
}

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(distClient, docsDir, { recursive: true });

const previousAssets = path.resolve(root, ".tmp", "previous-pages-assets");
try {
  await cp(previousAssets, docsDir, { recursive: true, force: false, errorOnExist: false });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const workerUrl = pathToFileURL(path.resolve(root, "dist", "server", "index.js"));
workerUrl.searchParams.set("export", String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request(`http://localhost${basePath}/`, {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        let assetPath = decodeURIComponent(url.pathname);
        if (basePath && (assetPath === basePath || assetPath.startsWith(basePath + "/"))) {
          assetPath = assetPath.slice(basePath.length) || "/";
        }
        const file = path.join(distClient, assetPath.replace(/^\/+/, ""));
        try {
          return new Response(await readFile(file));
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error("Falha ao renderizar a página estática: " + response.status);
}

let html = await response.text();
if (basePath) {
  if (html.includes('"/_next/') || !html.includes(`${basePath}/_next/`)) {
    throw new Error("Os arquivos do site não respeitam a subpasta configurada para o GitHub Pages.");
  }
} else {
  html = html
    .replaceAll('href="/', 'href="./')
    .replaceAll('src="/', 'src="./')
    .replaceAll('content="/', 'content="./')
    .replaceAll('url(/', 'url(./')
    .replaceAll('"/_next/', '"./_next/')
    .replaceAll('css:/_next/', 'css:./_next/');

  if (html.includes('"/_next/')) {
    throw new Error("A exportação ainda contém arquivos apontando para a raiz do domínio.");
  }
}

await writeFile(path.join(docsDir, "index.html"), html, "utf8");
await writeFile(path.join(docsDir, "404.html"), html, "utf8");
await writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");

console.log("Versão para GitHub Pages criada em docs/.");
