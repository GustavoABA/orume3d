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
  { route: "/parcerias/afiliados", output: path.join("parcerias", "afiliados", "index.html") },
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
  var submit=document.getElementById("quote-submit");
  var quantity=document.getElementById("q-qty");
  var quantityOther=document.getElementById("q-qty-other");
  var quantityOtherWrap=document.getElementById("q-qty-other-wrap");
  var clean=document.getElementById("q-clean");
  var modal=document.getElementById("clean-modal");
  var cleanConfirm=document.getElementById("clean-confirm");
  var cleanCancel=document.getElementById("clean-cancel");
  var endpoint="";
  var cleanConfirmed=false;

  if(!form)return;

  fetch("../intake-config.json",{cache:"no-store"})
    .then(function(response){return response.ok?response.json():{};})
    .then(function(config){endpoint=String(config.endpoint||"").trim();})
    .catch(function(){endpoint="";});

  function makeSiteId(){
    return "SITE-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
  }

  function resolveQuantity(){
    if(!quantity)return "";
    if(quantity.value!=="Outro")return quantity.value;
    return String(quantityOther&&quantityOther.value||"").trim();
  }

  function syncQuantity(){
    var other=quantity&&quantity.value==="Outro";
    if(quantityOtherWrap)quantityOtherWrap.style.display=other?"grid":"none";
    if(quantityOther)quantityOther.required=Boolean(other);
  }

  if(quantity){
    quantity.addEventListener("change",syncQuantity);
    syncQuantity();
  }

  function openCleanModal(){
    if(!modal)return;
    if(typeof modal.showModal==="function")modal.showModal();
    else {
      var accepted=window.confirm("Atendimento clean: a comunicação será objetiva e limitada ao necessário pelo WhatsApp. Isso não altera preço, prazo, prioridade ou qualidade; muda apenas o estilo do atendimento. Deseja ativar?");
      cleanConfirmed=accepted;
      if(clean)clean.checked=accepted;
    }
  }

  if(clean){
    clean.addEventListener("change",function(){
      if(clean.checked&&!cleanConfirmed)openCleanModal();
      if(!clean.checked)cleanConfirmed=false;
    });
  }

  if(cleanConfirm){
    cleanConfirm.addEventListener("click",function(){
      cleanConfirmed=true;
      if(clean)clean.checked=true;
      if(modal)modal.close();
    });
  }

  if(cleanCancel){
    cleanCancel.addEventListener("click",function(){
      cleanConfirmed=false;
      if(clean)clean.checked=false;
      if(modal)modal.close();
    });
  }

  if(modal){
    modal.addEventListener("cancel",function(){
      cleanConfirmed=false;
      if(clean)clean.checked=false;
    });
  }

  function formPayload(siteId){
    var data=new FormData(form);
    return {
      siteId:siteId,
      name:String(data.get("name")||"").trim(),
      phone:String(data.get("phone")||"").trim(),
      city:String(data.get("city")||"").trim(),
      referral:String(data.get("referral")||"").trim(),
      product:String(data.get("product")||"").trim(),
      quantity:resolveQuantity(),
      dimensions:String(data.get("dimensions")||"").trim(),
      color:String(data.get("color")||"").trim(),
      material:String(data.get("material")||"").trim(),
      deadline:String(data.get("deadline")||"").trim(),
      links:String(data.get("links")||"").trim(),
      description:String(data.get("description")||"").trim(),
      delivery:String(data.get("delivery")||"").trim(),
      cep:String(data.get("cep")||"").trim(),
      notes:String(data.get("notes")||"").trim(),
      cleanService:Boolean(clean&&clean.checked)
    };
  }

  function submitNoCors(payload){
    var body=new FormData();
    body.append("payload",JSON.stringify(payload));

    return fetch(endpoint,{
      method:"POST",
      body:body,
      mode:"no-cors",
      redirect:"follow",
      cache:"no-store"
    });
  }

  function getStatusJsonp(siteId){
    return new Promise(function(resolve,reject){
      var callback="__orumeStatus_"+Math.random().toString(36).slice(2);
      var script=document.createElement("script");
      var timer=0;

      function cleanup(){
        if(timer)window.clearTimeout(timer);
        try{delete window[callback];}catch(_){window[callback]=undefined;}
        if(script.parentNode)script.parentNode.removeChild(script);
      }

      window[callback]=function(data){
        cleanup();
        resolve(data||{});
      };

      script.onerror=function(){
        cleanup();
        reject(new Error("Falha ao consultar status"));
      };

      timer=window.setTimeout(function(){
        cleanup();
        reject(new Error("Timeout ao consultar status"));
      },8000);

      script.src=endpoint+
        "?action=status&siteId="+encodeURIComponent(siteId)+
        "&callback="+encodeURIComponent(callback)+
        "&_="+Date.now();
      script.async=true;
      document.head.appendChild(script);
    });
  }

  async function waitForConfirmation(siteId){
    var deadline=Date.now()+30000;
    var last={};

    while(Date.now()<deadline){
      try{
        last=await getStatusJsonp(siteId);

        if(last&&last.found&&last.complete){
          return last;
        }

        if(last&&last.found&&last.failed){
          throw new Error(last.error||"O Apps Script marcou o pedido como erro.");
        }
      }catch(error){
        if(error&&String(error.message||"").indexOf("marcou o pedido como erro")>=0){
          throw error;
        }
      }

      await new Promise(function(resolve){window.setTimeout(resolve,1500);});
    }

    throw new Error("Tempo de confirmação excedido");
  }

  form.addEventListener("submit",async function(event){
    event.preventDefault();
    if(!form.reportValidity())return;

    var resolvedQuantity=resolveQuantity();
    if(!resolvedQuantity){
      if(status)status.textContent="Informe a quantidade.";
      if(quantityOther)quantityOther.focus();
      return;
    }

    var siteId=makeSiteId();
    var payload=formPayload(siteId);
    var digits=payload.phone.replace(/\\D/g,"");
    if(digits.length<10){
      if(status)status.textContent="Informe um WhatsApp válido com DDD.";
      var phone=document.getElementById("q-phone");
      if(phone)phone.focus();
      return;
    }

    var cepDigits=payload.cep.replace(/\\D/g,"");
    if(cepDigits.length!==8){
      if(status)status.textContent="Informe um CEP válido com 8 dígitos.";
      var cep=document.getElementById("q-cep");
      if(cep)cep.focus();
      return;
    }

    if(!endpoint){
      if(status)status.textContent="A integração automática está temporariamente indisponível.";
      return;
    }

    if(submit)submit.disabled=true;
    if(status)status.textContent="Registrando seu orçamento…";

    try{
      try{
        localStorage.setItem("orume:lastQuotePending",JSON.stringify({
          siteId:siteId,
          createdAt:new Date().toISOString()
        }));
      }catch(_){}

      await submitNoCors(payload);
      var result=await waitForConfirmation(siteId);
      var orderText=result.orderId?(" Pedido "+result.orderId+"."):"";

      if(status)status.textContent="Orçamento recebido pela Orume."+orderText+" Entraremos em contato pelo WhatsApp informado.";

      try{localStorage.removeItem("orume:lastQuotePending");}catch(_){}
      form.reset();
      cleanConfirmed=false;
      syncQuantity();
    }catch(error){
      console.error("Falha no orçamento:",error);
      if(status)status.textContent="O pedido foi enviado, mas a confirmação não chegou. Aguarde alguns minutos antes de tentar novamente.";
    }finally{
      if(submit)submit.disabled=false;
    }
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

const affiliateFormScript = `<script>
(function(){
  var form=document.getElementById("affiliate-form");
  var status=document.getElementById("affiliate-status");
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
    var lines=["*PROPOSTA DE PARCERIA / AFILIADO — ORUME 3D*",""];
    add(lines,"Nome",data.get("name"));
    add(lines,"Nome público / empresa",data.get("publicName"));
    add(lines,"WhatsApp",data.get("phone"));
    add(lines,"Cidade / UF",data.get("city"));
    add(lines,"Tipo de parceria",data.get("type"));
    add(lines,"Perfil / site / canal",data.get("profile"));
    add(lines,"Como pretende indicar ou vender",data.get("how"));
    add(lines,"Volume / público aproximado",data.get("volume"));
    add(lines,"Comissão / modelo imaginado",data.get("commission"));
    add(lines,"Observações",data.get("notes"));
    lines.push("","Entendo que comissão, base de cálculo e pagamento precisam ser definidos com a Orume antes das vendas atribuídas.");
    var url="https://wa.me/5519989342212?text="+encodeURIComponent(lines.join("\\n"));
    if(status)status.textContent="Proposta pronta. Abrindo o WhatsApp para sua conferência…";
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
  } else if (route === "/parcerias/afiliados") {
    html = html.replace("</body>", affiliateFormScript + "</body>");
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
