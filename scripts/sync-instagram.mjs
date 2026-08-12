import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const instagramDir = path.resolve(projectRoot, "public", "instagram");
const temporaryDir = path.resolve(projectRoot, ".tmp", `instagram-sync-${process.pid}`);
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
const feedLimit = Math.min(Math.max(Number.parseInt(process.env.INSTAGRAM_FEED_LIMIT ?? "12", 10) || 12, 1), 25);
const apiBaseUrl = new URL(process.env.INSTAGRAM_API_BASE_URL ?? "https://graph.instagram.com");
const allowHttp = process.env.INSTAGRAM_ALLOW_HTTP === "true";

if (!accessToken) {
  throw new Error("Defina INSTAGRAM_ACCESS_TOKEN para sincronizar as publicacoes do Instagram.");
}

if (!instagramDir.startsWith(projectRoot + path.sep) || !temporaryDir.startsWith(projectRoot + path.sep)) {
  throw new Error("O diretorio do Instagram precisa ficar dentro do projeto.");
}

const mediaFields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
  "children{id,media_type,media_url,thumbnail_url}",
].join(",");

const mediaEndpoint = new URL("me/media", apiBaseUrl.href.endsWith("/") ? apiBaseUrl : `${apiBaseUrl.href}/`);
mediaEndpoint.searchParams.set("fields", mediaFields);
mediaEndpoint.searchParams.set("limit", String(feedLimit));

const response = await fetch(mediaEndpoint, {
  headers: {
    accept: "application/json",
    authorization: `Bearer ${accessToken}`,
    "user-agent": "Orume3D-Instagram-Sync/1.0",
  },
});

if (!response.ok) {
  let detail = "";
  try {
    const payload = await response.json();
    detail = payload?.error?.message ? `: ${payload.error.message}` : "";
  } catch {
    // The status code below is enough when Meta does not return JSON.
  }
  throw new Error(`A API do Instagram respondeu ${response.status}${detail}`);
}

const payload = await response.json();
if (!Array.isArray(payload?.data)) {
  throw new Error("A API do Instagram retornou um formato inesperado.");
}

const chooseImage = (media) => {
  if (media.media_type === "VIDEO") return media.thumbnail_url || media.media_url;
  if (media.media_type === "CAROUSEL_ALBUM") {
    const children = Array.isArray(media.children?.data) ? media.children.data : [];
    const cover = children.find((child) => child.media_type === "IMAGE") || children[0];
    return media.media_url || cover?.media_url || cover?.thumbnail_url;
  }
  return media.media_url || media.thumbnail_url;
};

const extensionByType = new Map([
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const normalizedTitle = (caption) => {
  const compact = String(caption ?? "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/(?:^|\s)#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return "Projeto publicado pela Orume 3D";
  return compact.length > 160 ? `${compact.slice(0, 157).trimEnd()}...` : compact;
};

const assertMediaUrl = (value) => {
  const url = new URL(value);
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) {
    throw new Error(`O Instagram retornou uma URL de midia insegura para ${url.hostname}.`);
  }
  return url;
};

await rm(temporaryDir, { recursive: true, force: true });
await mkdir(temporaryDir, { recursive: true });

const manifest = [];

try {
  for (const media of payload.data.slice(0, feedLimit)) {
    const source = chooseImage(media);
    if (!source || !media?.id || !media?.permalink) continue;

    const imageResponse = await fetch(assertMediaUrl(source), {
      headers: {
        accept: "image/*",
        "user-agent": "Orume3D-Instagram-Sync/1.0",
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Nao foi possivel baixar a midia ${media.id}: resposta ${imageResponse.status}.`);
    }

    const contentType = imageResponse.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    const extension = extensionByType.get(contentType);
    if (!extension) {
      throw new Error(`A midia ${media.id} nao e uma imagem compativel (${contentType || "sem tipo"}).`);
    }

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 25 * 1024 * 1024) {
      throw new Error(`A midia ${media.id} tem um tamanho invalido (${bytes.length} bytes).`);
    }

    const safeId = String(media.id).replace(/[^A-Za-z0-9_-]/g, "");
    if (!safeId) continue;

    const fileName = `instagram-${safeId}${extension}`;
    await writeFile(path.join(temporaryDir, fileName), bytes);
    manifest.push({
      id: String(media.id),
      src: `./instagram/${fileName}`,
      title: normalizedTitle(media.caption),
      href: String(media.permalink),
      mediaType: String(media.media_type || "IMAGE"),
      timestamp: String(media.timestamp || ""),
    });
  }

  if (manifest.length === 0) {
    throw new Error("O Instagram nao retornou nenhuma publicacao com imagem disponivel.");
  }

  manifest.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  await writeFile(path.join(temporaryDir, "feed.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  await rm(instagramDir, { recursive: true, force: true });
  await mkdir(path.dirname(instagramDir), { recursive: true });
  await rename(temporaryDir, instagramDir);

  const generatedFiles = await readdir(instagramDir);
  console.log(`Instagram sincronizado: ${manifest.length} publicacao(oes), ${generatedFiles.length - 1} imagem(ns).`);
} catch (error) {
  await rm(temporaryDir, { recursive: true, force: true });
  throw error;
}
