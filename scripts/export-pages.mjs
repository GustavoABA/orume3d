import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distClient = path.resolve(root, "dist", "client");
const docsDir = path.resolve(root, "docs");

if (!docsDir.startsWith(root + path.sep)) {
  throw new Error("Destino de exportação fora do projeto.");
}

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(distClient, docsDir, { recursive: true });

const workerUrl = pathToFileURL(path.resolve(root, "dist", "server", "index.js"));
workerUrl.searchParams.set("export", String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        const file = path.join(distClient, decodeURIComponent(url.pathname));
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
html = html
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./')
  .replaceAll('content="/', 'content="./')
  .replaceAll('url(/', 'url(./');

await writeFile(path.join(docsDir, "index.html"), html, "utf8");
await writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");

console.log("Versão para GitHub Pages criada em docs/.");
