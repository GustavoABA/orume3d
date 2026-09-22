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
  { route: "/orcamento", output: path.join("orcamento", "index.html") },
  { route: "/parcerias", output: path.join("parcerias", "index.html") },
  { route: "/parcerias/ficha", output: path.join("parcerias", "ficha", "index.html") },
  { route: "/parcerias/contrato", output: path.join("parcerias", "contrato", "index.html") },
  { route: "/termos", output: path.join("termos", "index.html") },
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

function stripClientRuntime(html) {
  return html
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

const homeMenuScript = `<script>
(function(){
  var button=document.querySelector(".menu-button");
  var nav=document.getElementById("site-navigation");
  var scrim=document.querySelector(".nav-scrim");
  if(!button||!nav||!scrim)return;
  function setOpen(open){
    button.classList.toggle("is-active",open);
    nav.classList.toggle("is-open",open);
    scrim.classList.toggle("is-open",open);
    button.setAttribute("aria-expanded",String(open));
    button.setAttribute("aria-label",open?"Fechar menu":"Abrir menu");
    scrim.tabIndex=open?0:-1;
    document.body.classList.toggle("modal-open",open);
  }
  button.addEventListener("click",function(){setOpen(button.getAttribute("aria-expanded")!=="true");});
  scrim.addEventListener("click",function(){setOpen(false);});
  nav.querySelectorAll("a").forEach(function(link){link.addEventListener("click",function(){setOpen(false);});});
  document.addEventListener("keydown",function(event){if(event.key==="Escape")setOpen(false);});
})();
</script>`;

const budgetFormScript = `<script>
(function(){
  var form=document.getElementById("quote-form");
  var status=document.getElementById("quote-status");
  if(!form)return;
  function clean(value){return String(value||"").trim();}
  function add(lines,label,value){
    value=clean(value);
    if(value)lines.push(label+": "+value);
  }
  form.addEventListener("submit",function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    var data=new FormData(form);
    var lines=["*PEDIDO DE ORÇAMENTO — SITE ORUME 3D*",""];
    add(lines,"Cliente",data.get("name"));
    add(lines,"WhatsApp",data.get("phone"));
    add(lines,"Cidade / UF",data.get("city"));
    add(lines,"Indicado por",data.get("referral"));
    lines.push("");
    add(lines,"Produto / peça",data.get("product"));
    add(lines,"Quantidade",data.get("quantity"));
    add(lines,"Medidas aproximadas",data.get("dimensions"));
    add(lines,"Cor",data.get("color"));
    add(lines,"Material",data.get("material"));
    add(lines,"Prazo desejado",data.get("deadline"));
    add(lines,"Forma de entrega",data.get("delivery"));
    add(lines,"CEP",data.get("cep"));
    add(lines,"Links / referências",data.get("links"));
    add(lines,"Detalhes do projeto",data.get("description"));
    add(lines,"Observações",data.get("notes"));
    lines.push("","Mensagem montada pelo formulário do site da Orume 3D.");
    var url="https://wa.me/5519989342212?text="+encodeURIComponent(lines.join("\\n"));
    if(status)status.textContent="Mensagem pronta. Abrindo o WhatsApp para sua conferência…";
    var opened=window.open(url,"_blank","noopener,noreferrer");
    if(!opened)window.location.href=url;
  });
})();
</script>`;

const creatorFormScript = `<script>
(function(){
  var form=document.getElementById("creator-form");
  var status=document.getElementById("creator-status");
  if(!form)return;
  function clean(value){return String(value||"").trim();}
  function add(lines,label,value){
    value=clean(value);
    if(value)lines.push(label+": "+value);
  }
  form.addEventListener("submit",function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    var data=new FormData(form);
    var lines=["*PRÉ-FICHA DE PRODUTO / COLEÇÃO — ORU-PAR-001*",""];
    add(lines,"Criador(a)",data.get("creatorName"));
    add(lines,"Nome artístico",data.get("artisticName"));
    add(lines,"Produto / coleção",data.get("collection"));
    add(lines,"Personagem / IP",data.get("ip"));
    add(lines,"Descrição",data.get("description"));
    add(lines,"Arte-base / origem",data.get("artBase"));
    add(lines,"Direitos de merchandising",data.get("merchRights"));
    lines.push("");
    add(lines,"Uso de IA",data.get("ai"));
    add(lines,"Ferramenta / etapa de IA",data.get("aiStage"));
    lines.push("");
    add(lines,"Modelo de venda",data.get("saleModel"));
    add(lines,"Preço desejado",data.get("price"));
    add(lines,"Participação do criador",data.get("creatorShare"));
    add(lines,"Base de cálculo",data.get("calculationBase"));
    add(lines,"Repasse",data.get("payout"));
    add(lines,"Custo do protótipo",data.get("prototypeCost"));
    lines.push("");
    add(lines,"Lote / quantidade",data.get("lot"));
    add(lines,"Prazo desejado",data.get("deadline"));
    add(lines,"Acabamento",data.get("finish"));
    add(lines,"Estado do protótipo / render",data.get("preview"));
    add(lines,"Observações",data.get("notes"));
    lines.push("","Esta é uma pré-ficha de conversa e não substitui o Anexo A aprovado/assinado.");
    var url="https://wa.me/5519989342212?text="+encodeURIComponent(lines.join("\\n"));
    if(status)status.textContent="Pré-ficha pronta. Abrindo o WhatsApp para sua conferência…";
    var opened=window.open(url,"_blank","noopener,noreferrer");
    if(!opened)window.location.href=url;
  });
})();
</script>`;

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

  let html = stripClientRuntime(await response.text());

  if (route === "/") {
    html = html.replace("</body>", homeMenuScript + "</body>");
  } else if (route === "/orcamento") {
    html = html.replace("</body>", budgetFormScript + "</body>");
  } else if (route === "/parcerias/ficha") {
    html = html.replace("</body>", creatorFormScript + "</body>");
  }

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

console.log("Versão para GitHub Pages criada em docs/, incluindo orçamento, parcerias, ficha de coleção e contratos.");
