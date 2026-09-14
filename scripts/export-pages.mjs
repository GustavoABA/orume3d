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

const pages = [
  { route: "/", output: "index.html" },
  { route: "/evelyn", output: path.join("evelyn", "index.html") },
];

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

const env = {
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
};

const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
};

async function renderPage(route) {
  const response = await worker.fetch(
    new Request(`http://localhost${basePath}${route}`, {
      headers: { accept: "text/html" },
    }),
    env,
    executionContext,
  );

  if (!response.ok) {
    throw new Error(`Falha ao renderizar a página estática ${route}: ${response.status}`);
  }

  let html = await response.text();

  if (basePath) {
    if (html.includes('"/_next/') || !html.includes(`${basePath}/_next/`)) {
      throw new Error(`Os arquivos da rota ${route} não respeitam a subpasta configurada para o GitHub Pages.`);
    }
  } else {
    const depth = route.split("/").filter(Boolean).length;
    const relativePrefix = depth === 0 ? "./" : "../".repeat(depth);

    html = html
      .replaceAll('href="/', `href="${relativePrefix}`)
      .replaceAll('src="/', `src="${relativePrefix}`)
      .replaceAll('content="/', `content="${relativePrefix}`)
      .replaceAll('url(/', `url(${relativePrefix}`)
      .replaceAll('"/_next/', `"${relativePrefix}_next/`)
      .replaceAll('css:/_next/', `css:${relativePrefix}_next/`);

    if (html.includes('"/_next/')) {
      throw new Error(`A exportação da rota ${route} ainda contém arquivos apontando para a raiz do domínio.`);
    }
  }

  return html;
}

let homeHtml = "";

for (const page of pages) {
  const html = await renderPage(page.route);
  const outputPath = path.join(docsDir, page.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");

  if (page.route === "/") homeHtml = html;
}

if (!homeHtml) {
  throw new Error("A página inicial não foi exportada.");
}

await writeFile(path.join(docsDir, "404.html"), homeHtml, "utf8");
await writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");

console.log("Versão para GitHub Pages criada em docs/, incluindo /evelyn/.");
