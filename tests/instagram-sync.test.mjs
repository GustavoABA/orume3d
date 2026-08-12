import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const syncScript = path.join(projectRoot, "scripts", "sync-instagram.mjs");
const generateScript = path.join(projectRoot, "scripts", "generate-feed.mjs");
const testRoot = path.join(projectRoot, ".tmp");

const createWorkspace = async () => {
  await mkdir(testRoot, { recursive: true });
  const workspace = await mkdtemp(path.join(testRoot, "instagram-test-"));
  await mkdir(path.join(workspace, "public", "feed"), { recursive: true });
  return workspace;
};

test("baixa fotos, capa de video e carrossel sem recomprimir", async (context) => {
  const workspace = await createWorkspace();
  context.after(() => rm(workspace, { recursive: true, force: true }));

  const downloaded = [];
  let baseUrl = "";
  const server = http.createServer((request, response) => {
    if (request.url?.startsWith("/me/media")) {
      assert.equal(request.headers.authorization, "Bearer segredo-de-teste");
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({
        data: [
          {
            id: "101",
            caption: "Peca azul #impressao3d",
            media_type: "IMAGE",
            media_url: `${baseUrl}/foto.jpg`,
            permalink: "https://www.instagram.com/p/foto/",
            timestamp: "2026-08-12T12:00:00+0000",
          },
          {
            id: "102",
            caption: "Reel da bancada",
            media_type: "VIDEO",
            thumbnail_url: `${baseUrl}/reel.png`,
            permalink: "https://www.instagram.com/reel/video/",
            timestamp: "2026-08-12T13:00:00+0000",
          },
          {
            id: "103",
            media_type: "CAROUSEL_ALBUM",
            permalink: "https://www.instagram.com/p/carrossel/",
            timestamp: "2026-08-12T14:00:00+0000",
            children: { data: [{ id: "103-1", media_type: "IMAGE", media_url: `${baseUrl}/carrossel.webp` }] },
          },
        ],
      }));
      return;
    }

    assert.equal(request.headers.authorization, undefined, "o token nao pode ser enviado para o CDN de imagens");
    downloaded.push(request.url);
    const fixtures = {
      "/foto.jpg": ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xd9])],
      "/reel.png": ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
      "/carrossel.webp": ["image/webp", Buffer.from("RIFFwebp")],
    };
    const fixture = fixtures[request.url];
    if (!fixture) {
      response.statusCode = 404;
      response.end();
      return;
    }
    response.setHeader("content-type", fixture[0]);
    response.end(fixture[1]);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;

  await execFileAsync(process.execPath, [syncScript], {
    cwd: workspace,
    env: {
      ...process.env,
      INSTAGRAM_ACCESS_TOKEN: "segredo-de-teste",
      INSTAGRAM_API_BASE_URL: baseUrl,
      INSTAGRAM_ALLOW_HTTP: "true",
    },
  });

  const manifest = JSON.parse(await readFile(path.join(workspace, "public", "instagram", "feed.json"), "utf8"));
  assert.deepEqual(manifest.map((item) => item.id), ["103", "102", "101"]);
  assert.equal(manifest[0].title, "Projeto publicado pela Orume 3D");
  assert.equal(manifest[2].title, "Peca azul");
  assert.deepEqual(downloaded.sort(), ["/carrossel.webp", "/foto.jpg", "/reel.png"]);
  assert.deepEqual(
    await readFile(path.join(workspace, "public", "instagram", "instagram-101.jpg")),
    Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  );
});

test("coloca o Instagram primeiro e evita duplicar uma foto local", async (context) => {
  const workspace = await createWorkspace();
  context.after(() => rm(workspace, { recursive: true, force: true }));
  await mkdir(path.join(workspace, "public", "instagram"), { recursive: true });
  await writeFile(path.join(workspace, "public", "feed", "01-instagram-repetido.jpg"), "local");
  await writeFile(path.join(workspace, "public", "feed", "02-peca-local.jpg"), "local");
  await writeFile(
    path.join(workspace, "public", "instagram", "feed.json"),
    JSON.stringify([{
      id: "200",
      src: "./instagram/instagram-200.jpg",
      title: "Novo projeto",
      href: "https://www.instagram.com/p/repetido/",
      timestamp: "2026-08-12T15:00:00+0000",
    }]),
  );

  await execFileAsync(process.execPath, [generateScript], { cwd: workspace, env: process.env });
  const manifest = JSON.parse(await readFile(path.join(workspace, "public", "feed", "feed.json"), "utf8"));
  assert.equal(manifest.length, 2);
  assert.equal(manifest[0].id, "200");
  assert.equal(manifest[1].src, "./feed/02-peca-local.jpg");
});
