import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const feedDir = path.join(projectRoot, "public", "feed");
const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const files = (await readdir(feedDir))
  .filter((file) => allowed.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

const titleFromName = (file) => {
  const bareName = path.basename(file, path.extname(file));

  if (/instagram-[A-Za-z0-9_-]+$/i.test(bareName)) {
    return "Projeto publicado pela Orume 3D";
  }

  const readable = bareName
    .replace(/^\d+[\s_-]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = readable
    ? readable.charAt(0).toUpperCase() + readable.slice(1)
    : "Criação Orume 3D";

  return title.replace(/\b3d\b/gi, "3D");
};

const localManifest = files.map((file) => ({
  src: "./feed/" + encodeURIComponent(file),
  title: titleFromName(file),
  ...(file.match(/instagram-([A-Za-z0-9_-]+)\.[^.]+$/i)
    ? { href: "https://www.instagram.com/p/" + file.match(/instagram-([A-Za-z0-9_-]+)\.[^.]+$/i)[1] + "/" }
    : {}),
}));

let instagramManifest = [];
try {
  const parsed = JSON.parse(
    await readFile(path.join(projectRoot, "public", "instagram", "feed.json"), "utf8"),
  );
  if (Array.isArray(parsed)) instagramManifest = parsed;
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const normalizedHref = (href) => String(href ?? "").replace(/[?#].*$/, "").replace(/\/+$/, "");
const instagramLinks = new Set(instagramManifest.map((item) => normalizedHref(item.href)).filter(Boolean));
const manifest = [
  ...instagramManifest,
  ...localManifest.filter((item) => !item.href || !instagramLinks.has(normalizedHref(item.href))),
];

await writeFile(
  path.join(feedDir, "feed.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

console.log(
  `Feed atualizado com ${manifest.length} imagem(ns): ${instagramManifest.length} do Instagram e ${manifest.length - instagramManifest.length} local(is).`,
);
