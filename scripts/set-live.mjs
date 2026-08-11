import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "");
}

const status = (args.get("--status") ?? "").trim().toLowerCase();
const suppliedUrl = (args.get("--url") ?? "").trim();
const suppliedTitle = (args.get("--title") ?? "").trim();
const configPath = path.resolve(process.cwd(), "public", "live.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

function extractVideoId(value) {
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return "";
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";

  if (host === "youtube.com" || host === "m.youtube.com") {
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split("/").filter(Boolean);
    if (["live", "embed", "shorts"].includes(parts[0])) return parts[1] ?? "";
  }

  return "";
}

if (!["ligada", "desligada", "on", "off"].includes(status)) {
  throw new Error("Use --status ligada ou --status desligada.");
}

if (["ligada", "on"].includes(status)) {
  const videoId = suppliedUrl ? extractVideoId(suppliedUrl) : config.videoId;

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId ?? "")) {
    throw new Error("Cole o link completo da transmissão do YouTube para ligar a live.");
  }

  config.active = true;
  config.videoId = videoId;
  config.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
} else {
  config.active = false;
}

if (suppliedTitle) config.title = suppliedTitle;
config.updatedAt = new Date().toISOString();

await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
console.log(config.active ? "Live ligada no site." : "Live desligada no site.");
