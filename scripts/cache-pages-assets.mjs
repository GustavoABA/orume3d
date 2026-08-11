import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = new URL("https://gustavoaba.github.io/orume3d/");
const cacheRoot = path.resolve(process.cwd(), ".tmp", "previous-pages-assets");

await rm(cacheRoot, { recursive: true, force: true });

try {
  const pageResponse = await fetch(siteUrl, {
    headers: { "user-agent": "Orume3D-GitHub-Pages-Deploy" },
  });

  if (!pageResponse.ok) throw new Error(`Página atual respondeu ${pageResponse.status}.`);

  const html = await pageResponse.text();
  const candidates = new Set();
  const referencePattern = /(?:src|href)="([^"]+\/_next\/static\/[^"]+)"/g;

  for (const match of html.matchAll(referencePattern)) {
    const assetUrl = new URL(match[1], siteUrl);
    if (
      assetUrl.origin === siteUrl.origin
      && assetUrl.pathname.startsWith("/orume3d/_next/static/")
    ) {
      candidates.add(assetUrl.href);
    }
  }

  for (const candidate of candidates) {
    const assetUrl = new URL(candidate);
    const relativePath = decodeURIComponent(assetUrl.pathname.slice("/orume3d/".length));
    const destination = path.resolve(cacheRoot, relativePath);

    if (!destination.startsWith(cacheRoot + path.sep)) {
      throw new Error("Caminho inválido encontrado ao preservar arquivos da versão atual.");
    }

    const assetResponse = await fetch(assetUrl, {
      headers: { "user-agent": "Orume3D-GitHub-Pages-Deploy" },
    });
    if (!assetResponse.ok) continue;

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, Buffer.from(await assetResponse.arrayBuffer()));
  }

  console.log(`Preservados ${candidates.size} arquivo(s) da publicação atual.`);
} catch (error) {
  console.warn(`Não foi possível preservar a versão anterior: ${error.message}`);
}
