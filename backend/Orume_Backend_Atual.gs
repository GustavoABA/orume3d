const SPREADSHEET_ID='1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI';
const S={orders:'Pedidos',products:'Produtos',customers:'Clientes',logs:'Logs',history:'Histórico'};
const MAX_ORDER_ID=1000, DONE=['Concluído','Cancelado'], VERSION=5;

function doGet(e){
  try{
    const p=e&&e.parameter||{},a=String(p.action||'ping');
    if(a==='ping')return out({ok:true,version:VERSION,spreadsheetId:SPREADSHEET_ID},p.callback);
    if(a==='catalog')return out({ok:true,products:publicCatalog()},p.callback);
    if(a==='affiliate')return out({ok:true,affiliate:needAffiliate(p.code)},p.callback);
    if(a==='status')return out(orderStatus(p.siteId),p.callback);
    needAdmin(p.adminKey);
    if(a==='adminSnapshot')return out({ok:true,orders:listOrders(),products:products(),affiliates:affiliates()},p.callback);
    if(a==='adminOrder')return out({ok:true,order:orderById(p.id)},p.callback);
    if(a==='adminProduct')return out({ok:true,product:productById(p.id)},p.callback);
    if(a==='scrapeShopee')return out(scrapeShopee(p.url),p.callback);
    return out({ok:false,error:'Ação GET desconhecida.'},p.callback);
  }catch(err){
    return out({ok:false,error:errMsg(err)},e&&e.parameter&&e.parameter.callback);
  }
}

function doPost(e){
  const lock=LockService.getScriptLock();
  lock.waitLock(25000);
  try{
    const p=parseBody(e),a=String(p.action||'quote');
    if(a==='createCheckout')return out(createCheckout(p));
    if(a==='quote')return out(createQuote(p));
    needAdmin(p.adminKey);
    if(a==='adminSaveOrder')return out({ok:true,order:saveOrder(p.order||{})});
    if(a==='adminCompleteOrder')return out({ok:true,order:completeOrder(p.id)});
    if(a==='adminSaveProduct')return out({ok:true,product:saveProduct(p.product||{},p.mode||'')});
    if(a==='adminSaveAffiliate')return out({ok:true,affiliate:saveAffiliate(p.affiliate||{},p.mode||'')});
    return out({ok:false,error:'Ação POST desconhecida.'});
  }catch(err){
    log('Erro','doPost','','','API',errMsg(err),'');
    return out({ok:false,error:errMsg(err)});
  }finally{
    lock.releaseLock();
  }
}

function parseBody(e){
  if(e&&e.parameter&&e.parameter.payload)return JSON.parse(String(e.parameter.payload));
  if(e&&e.postData&&e.postData.contents){
    const r=String(e.postData.contents||'').trim();
    if(r)return JSON.parse(r);
  }
  return{};
}
function sheet(n){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(n);
  if(!s)throw new Error('Aba não encontrada: '+n);
  return s;
}
function needAdmin(k){
  const v=PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if(!v)throw new Error('ADMIN_KEY ainda não foi configurada no Apps Script.');
  if(String(k||'')!==v)throw new Error('Acesso administrativo negado.');
}
function txt(v,n){return String(v==null?'':v).trim().slice(0,n||500)}
function phone(v){
  let d=String(v||'').replace(/\D/g,'');
  if(d.startsWith('55')&&d.length>11)d=d.slice(2);
  return d.length>=10&&d.length<=11?d:'';
}
function cep(v){
  const d=String(v||'').replace(/\D/g,'');
  return d.length===8?d.slice(0,5)+'-'+d.slice(5):'';
}
function money(v){
  if(v==null||v==='')return 0;
  if(typeof v==='string'){
    let x=v.trim().replace(/[^0-9,.-]/g,'');
    if(x.includes(',')&&x.includes('.'))x=x.replace(/\./g,'').replace(',','.');
    else if(x.includes(','))x=x.replace(',','.');
    v=x;
  }
  const n=Number(v);
  return Number.isFinite(n)?Math.max(0,Math.round((n+Number.EPSILON)*100)/100):0;
}
function yes(v){return ['sim','true','1'].includes(String(v||'').toLowerCase())}
function fmtId(v){const n=Number(v);return Number.isFinite(n)?String(Math.trunc(n)).padStart(4,'0'):''}
function fmtMoney(v){return 'R$ '+money(v).toFixed(2).replace('.',',')}
function serial(v){return v instanceof Date?Utilities.formatDate(v,'America/Sao_Paulo',"yyyy-MM-dd'T'HH:mm:ssXXX"):(v==null?'':v)}
function findRow(sh,col,val){
  const last=sh.getLastRow();
  if(last<=1)return 0;
  const a=sh.getRange(2,col,last-1,1).getValues(),t=String(val);
  for(let i=0;i<a.length;i++)if(String(a[i][0])===t)return i+2;
  return 0;
}
function out(data,cb){
  const j=JSON.stringify(data),c=/^[A-Za-z_$][0-9A-Za-z_$\.]{0,100}$/.test(String(cb||''))?String(cb):'';
  return ContentService.createTextOutput(c?c+'('+j+');':j).setMimeType(c?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
function errMsg(e){return txt(e&&e.message?e.message:e,800)||'Erro desconhecido.'}
function log(t,a,en,id,o,s,d){
  try{sheet(S.logs).appendRow([new Date(),t,a,en,id,o,s,d])}catch(e){console.error(e)}
}

function allocateOrderId(){
  const sh=sheet(S.orders),last=sh.getLastRow();
  if(last<=1)return 0;
  const rows=sh.getRange(2,1,last-1,32).getValues(),used={};
  rows.forEach(r=>{
    const id=Number(r[0]);
    if(Number.isInteger(id)&&id>=0&&id<=MAX_ORDER_ID)used[id]=true;
  });
  for(let i=0;i<=MAX_ORDER_ID;i++)if(!used[i])return i;
  let cand=null;
  rows.forEach((r,i)=>{
    if(!DONE.includes(String(r[4]||'')))return;
    const d=r[29]instanceof Date?r[29]:r[3]instanceof Date?r[3]:r[2]instanceof Date?r[2]:new Date(0);
    if(!cand||d<cand.d)cand={row:i+2,r,d};
  });
  if(!cand)throw new Error('Os IDs 0000–1000 estão ocupados e não há pedido concluído para reciclar.');
  sheet(S.history).appendRow(cand.r);
  sh.deleteRow(cand.row);
  return Number(cand.r[0]);
}
function setBalanceFormula(sh,row){sh.getRange(row,25).setFormula('=IF(W'+row+'="","",MAX(0,W'+row+'-X'+row+'))')}
function ensureAffiliateCols(sh){
  if(sh.getMaxColumns()<35)sh.insertColumnsAfter(sh.getMaxColumns(),35-sh.getMaxColumns());
  const expected=['Afiliado','Acréscimo afiliado (%)','Valor acréscimo afiliado'];
  const h=sh.getRange(1,33,1,3).getValues()[0];
  if(h.some((v,i)=>v&&v!==expected[i]))throw new Error('As colunas 33–35 da aba '+sh.getName()+' já estão ocupadas.');
  sh.getRange(1,33,1,3).setValues([expected]);
}
function upsertCustomer(r){
  const sh=sheet(S.customers),p=String(r[7]||''),row=p?findRow(sh,3,p):0,now=new Date();
  if(row){
    sh.getRange(row,2).setValue(r[6]||sh.getRange(row,2).getValue());
    sh.getRange(row,8).setValue(now);
    sh.getRange(row,9).setValue(Number(sh.getRange(row,9).getValue()||0)+1);
    return;
  }
  sh.appendRow(['CLI-'+Utilities.getUuid().slice(0,8).toUpperCase(),r[6],p,'',r[9]||'',r[8]||'',now,now,1,0,'']);
}

function createCheckout(p){
  const checkoutId=txt(p.checkoutId,120)||('CHK-'+Utilities.getUuid().slice(0,12).toUpperCase());
  const name=txt(p.name,180),ph=phone(p.phone),raw=Array.isArray(p.cart)?p.cart:[];
  if(!name)throw new Error('Nome obrigatório.');
  if(!ph)throw new Error('Informe um WhatsApp válido com DDD.');
  if(!raw.length)throw new Error('Carrinho vazio.');

  const sh=sheet(S.orders),dup=findRow(sh,2,checkoutId);
  if(dup){
    const r=sh.getRange(dup,1,1,32).getValues()[0];
    return{ok:true,duplicate:true,checkoutId,orderId:fmtId(r[0]),uid:r[31],status:r[4]};
  }

  const aff=checkoutAffiliate(p),cat=products();
  let affCents=0,totalQty=0;
  const cart=raw.map(i=>{
    const pr=cat.find(x=>x.id===Number(i.id)&&yes(x.active));
    if(!pr)throw new Error('Um produto do carrinho não está mais disponível. Atualize a página.');
    const q=Number(i.quantity);
    if(!Number.isInteger(q)||q<1||q>99)throw new Error('Quantidade inválida no carrinho.');
    const base=pr.salePrice>0?pr.salePrice:pr.price;
    const unit=aff?affiliatePrice(base,aff.rate):money(base);
    const total=money(unit*q);
    totalQty+=q;
    if(aff)affCents+=Math.round((unit-base)*100)*q;
    return{id:pr.id,sku:pr.sku||'',name:pr.name,quantity:q,basePrice:money(base),unitPrice:unit,total};
  });
  const subtotal=money(cart.reduce((s,i)=>s+i.total,0));
  if(p.subtotal!==undefined&&p.subtotal!==null&&p.subtotal!==''&&Math.abs(money(p.subtotal)-subtotal)>.01){
    throw new Error('O preço de um produto foi atualizado. Recarregue a página e tente novamente.');
  }

  const details=cart.map(i=>i.quantity+'x '+i.name+' — '+fmtMoney(i.total)).join('\n');
  const summary=cart.map(i=>i.quantity+'x '+i.name).join(' + ').slice(0,240);
  const id=allocateOrderId(),uid=Utilities.getUuid(),now=new Date();
  const notes=[
    'Pedido registrado diretamente pelo site.',
    'Entrar em contato com o cliente pelo WhatsApp informado.',
    aff?'Afiliado: '+aff.code+' ('+aff.rate+'%)':''
  ].filter(Boolean).join('\n');

  ensureAffiliateCols(sh);
  const row=[
    id,checkoutId,now,now,'Aguardando contato','Normal',name,ph,'','',
    aff?aff.code:'',summary,totalQty,'','','A confirmar','','',
    details.slice(0,3000),'A combinar','Não',notes.slice(0,2500),
    subtotal,0,'','A combinar','Pendente','','Site ORUME','','',uid,
    aff?aff.code:'',aff?aff.rate:'',aff?affCents/100:''
  ];
  sh.appendRow(row);
  setBalanceFormula(sh,sh.getLastRow());
  upsertCustomer(row);
  log('Pedido','Criado','Pedido',uid,'Site','Pedido rápido '+fmtId(id),checkoutId);
  return{
    ok:true,checkoutId,orderId:fmtId(id),uid,status:'Aguardando contato',total:subtotal,
    message:'Pedido registrado. A Orume vai entrar em contato pelo WhatsApp informado.'
  };
}

function createQuote(p){
  const siteId=txt(p.siteId,80),name=txt(p.name,180),ph=phone(p.phone),z=cep(p.cep),prod=txt(p.product,240);
  const q=Math.max(1,parseInt(p.quantity||1,10)||1);
  if(!siteId)throw new Error('ID Site ausente.');
  if(!name||!ph||!z||!prod)throw new Error('Nome, WhatsApp, CEP e produto são obrigatórios.');
  const sh=sheet(S.orders),dup=findRow(sh,2,siteId);
  if(dup){
    const r=sh.getRange(dup,1,1,32).getValues()[0];
    return{ok:true,duplicate:true,orderId:fmtId(r[0]),uid:r[31]};
  }
  const aff=checkoutAffiliate(p),id=allocateOrderId(),uid=Utilities.getUuid(),now=new Date();
  const row=[
    id,siteId,now,now,'Orçamento','Normal',name,ph,txt(p.city,180),z,
    aff?aff.code:txt(p.referral,180),prod,q,txt(p.dimensions,180),txt(p.color,120),
    txt(p.material,120)||'Avaliar com a Orume',txt(p.deadline,80),txt(p.links,1500),
    txt(p.description,3000),txt(p.delivery,160)||'A combinar',p.cleanService?'Sim':'Não',
    txt(p.notes,2500),money(p.amount),0,'',txt(p.paymentMethod,120),'Pendente','','Site ORUME','','',uid,
    aff?aff.code:'',aff?aff.rate:'',''
  ];
  ensureAffiliateCols(sh);
  sh.appendRow(row);
  setBalanceFormula(sh,sh.getLastRow());
  upsertCustomer(row);
  return{ok:true,orderId:fmtId(id),uid};
}

function orderStatus(siteId){
  const id=txt(siteId,120);
  if(!id)return{found:false};
  const sh=sheet(S.orders),row=findRow(sh,2,id);
  if(!row)return{found:false};
  const r=sh.getRange(row,1,1,32).getValues()[0];
  return{found:true,complete:true,failed:false,orderId:fmtId(r[0]),status:r[4]};
}
function orderObj(r){
  return{
    id:Number(r[0]),displayId:fmtId(r[0]),siteId:r[1]||'',createdAt:serial(r[2]),updatedAt:serial(r[3]),
    status:r[4]||'',priority:r[5]||'',name:r[6]||'',phone:r[7]||'',city:r[8]||'',cep:r[9]||'',
    referral:r[10]||'',product:r[11]||'',quantity:r[12]||'',dimensions:r[13]||'',color:r[14]||'',
    material:r[15]||'',deadline:serial(r[16]),links:r[17]||'',description:r[18]||'',delivery:r[19]||'',
    cleanService:r[20]||'',notes:r[21]||'',amount:Number(r[22]||0),paid:Number(r[23]||0),
    balance:Number(r[24]||0),paymentMethod:r[25]||'',paymentStatus:r[26]||'',tracking:r[27]||'',
    origin:r[28]||'',completedAt:serial(r[29]),lastError:r[30]||'',uid:r[31]||''
  };
}
function listOrders(){
  const sh=sheet(S.orders),last=sh.getLastRow();
  if(last<=1)return[];
  return sh.getRange(2,1,last-1,32).getValues()
    .filter(r=>r[0]!==''&&r[0]!=null)
    .sort((a,b)=>(b[3]instanceof Date?b[3].getTime():0)-(a[3]instanceof Date?a[3].getTime():0))
    .slice(0,250).map(orderObj);
}
function orderById(id){
  const sh=sheet(S.orders),row=findRow(sh,1,Number(id));
  return row?orderObj(sh.getRange(row,1,1,32).getValues()[0]):null;
}
function saveOrder(o){
  const id=Number(o.id);
  if(!Number.isInteger(id)||id<0||id>MAX_ORDER_ID)throw new Error('ID do pedido inválido.');
  const sh=sheet(S.orders),row=findRow(sh,1,id);
  if(!row)throw new Error('Pedido '+fmtId(id)+' não encontrado.');
  const r=sh.getRange(row,1,1,32).getValues()[0];
  r[3]=new Date();
  [
    ['status',4,80],['priority',5,80],['name',6,180],['city',8,180],['referral',10,180],
    ['product',11,240],['dimensions',13,180],['color',14,120],['material',15,120],['deadline',16,80],
    ['links',17,1500],['description',18,3000],['delivery',19,160],['cleanService',20,20],['notes',21,2500],
    ['paymentMethod',25,120],['paymentStatus',26,120],['tracking',27,220]
  ].forEach(x=>{if(o[x[0]]!==undefined)r[x[1]]=txt(o[x[0]],x[2])});
  if(o.phone!==undefined)r[7]=phone(o.phone)||txt(o.phone,40);
  if(o.cep!==undefined)r[9]=cep(o.cep)||txt(o.cep,20);
  if(o.quantity!==undefined)r[12]=Math.max(1,parseInt(o.quantity||1,10)||1);
  if(o.amount!==undefined)r[22]=money(o.amount);
  if(o.paid!==undefined)r[23]=money(o.paid);
  r[24]=Math.max(0,r[22]-r[23]);
  if(DONE.includes(r[4])&&!r[29])r[29]=new Date();
  sh.getRange(row,1,1,32).setValues([r]);
  return orderObj(r);
}
function completeOrder(id){
  const sh=sheet(S.orders),row=findRow(sh,1,Number(id));
  if(!row)throw new Error('Pedido não encontrado.');
  sh.getRange(row,5).setValue('Concluído');
  sh.getRange(row,4).setValue(new Date());
  sh.getRange(row,30).setValue(new Date());
  return orderObj(sh.getRange(row,1,1,32).getValues()[0]);
}

function normalizeDimension_(v){
  if(v===undefined||v===null||String(v).trim()==='')return '';
  if(typeof v==='string'&&v.includes('.'))throw new Error('Medida inválida.');
  const n=typeof v==='string'?Number(v.trim().replace(',','.')):Number(v);
  if(!Number.isFinite(n)||n<=0||n>10000)throw new Error('Medida inválida.');
  return n;
}
function dim(r,h,n){
  const headers=Array.isArray(h)?h:[];
  const i=headers.indexOf(n),v=i>=0?r[i]:'';
  if(v===undefined||v===null||String(v).trim()==='')return '';
  try{return normalizeDimension_(v)}catch(_){return ''}
}
function productObj(r,h){
  return{
    heightCm:dim(r,h,'Altura (cm)'),widthCm:dim(r,h,'Largura (cm)'),depthCm:dim(r,h,'Profundidade (cm)'),
    id:Number(r[0]),sku:r[1]||'',active:r[2]||'',featured:r[3]||'',name:r[4]||'',slug:r[5]||'',
    category:r[6]||'',description:r[7]||'',price:Number(r[8]||0),salePrice:Number(r[9]||0),
    stock:Number(r[10]||0),productionDays:Number(r[11]||0),shopeeUrl:r[12]||'',scrapeStatus:r[13]||'',
    scrapeAttemptAt:serial(r[14]),detectedTitle:r[15]||'',detectedPrice:Number(r[16]||0),
    detectedImage:r[17]||'',imageMain:r[18]||'',image2:r[19]||'',image3:r[20]||'',
    adminNotes:r[21]||'',updatedAt:serial(r[22])
  };
}
function products(){
  const sh=sheet(S.products),last=sh.getLastRow();
  if(last<=1)return[];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  return sh.getRange(2,1,last-1,Math.max(23,h.length)).getValues()
    .filter(r=>r[0]!==''&&r[0]!=null).map(r=>productObj(r,h));
}
function publicCatalog(){
  return products().filter(p=>yes(p.active)).map(p=>({
    id:p.id,sku:p.sku,name:p.name,slug:p.slug,category:p.category,description:p.description,
    price:p.salePrice>0?p.salePrice:p.price,originalPrice:p.price,stock:p.stock,productionDays:p.productionDays,
    heightCm:p.heightCm,widthCm:p.widthCm,depthCm:p.depthCm,shopeeUrl:p.shopeeUrl,
    image:p.imageMain||p.detectedImage,images:[p.imageMain,p.image2,p.image3,p.detectedImage].filter(Boolean)
  }));
}
function productById(id){
  const sh=sheet(S.products),row=findRow(sh,1,Number(id));
  if(!row)return null;
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  return productObj(sh.getRange(row,1,1,Math.max(23,h.length)).getValues()[0],h);
}
function ensureDims(sh){
  const labels=['Altura (cm)','Largura (cm)','Profundidade (cm)'];
  const width=Math.max(23,sh.getLastColumn());
  const h=sh.getRange(1,1,1,width).getValues()[0];
  return labels.map(l=>{
    let i=h.indexOf(l);
    if(i<0){
      i=h.length;
      if(sh.getMaxColumns()<i+1)sh.insertColumnsAfter(sh.getMaxColumns(),i+1-sh.getMaxColumns());
      sh.getRange(1,i+1).setValue(l);
      h.push(l);
    }
    return i+1;
  });
}
function normUrl(v){const s=txt(v,2000);return /^https?:\/\//i.test(s)?s:''}
function shopeeUrl(v){
  const s=normUrl(v),m=s.match(/^https:\/\/([a-z0-9.-]+)(\/.*)?$/i);
  if(!m)return'';
  const h=m[1].toLowerCase();
  return(h==='shopee.com.br'||h.endsWith('.shopee.com.br')||h==='shopee.com'||h.endsWith('.shopee.com'))?s:'';
}
function slug(v){
  return txt(v,240).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
}
function saveProduct(p,mode){
  const sh=sheet(S.products),dims=ensureDims(sh),req=Number(p.id);
  let id,row;
  if(String(mode).toLowerCase()==='create'||!Number.isInteger(req)||req<=0){
    const ids=products().map(x=>x.id);
    id=ids.length?Math.max.apply(null,ids)+1:1;
    row=sh.getLastRow()+1;
  }else{
    id=req;
    row=findRow(sh,1,id);
    if(!row)throw new Error('Produto #'+id+' não encontrado para edição.');
  }

  const normalizedDims={};
  ['heightCm','widthCm','depthCm'].forEach(key=>{
    if(p[key]!==undefined)normalizedDims[key]=normalizeDimension_(p[key]);
  });

  const existing=row<=sh.getLastRow()?sh.getRange(row,1,1,23).getValues()[0]:[];
  const pick=(key,index,fallback='')=>p[key]!==undefined?p[key]:(existing[index]!==undefined?existing[index]:fallback);
  const vals=[
    id,
    txt(pick('sku',1),100),
    p.active!==undefined?(yes(p.active)?'Sim':'Não'):(existing[2]||'Sim'),
    p.featured!==undefined?(yes(p.featured)?'Sim':'Não'):(existing[3]||'Não'),
    txt(pick('name',4),240),
    slug(p.slug!==undefined?p.slug:(p.name!==undefined?p.name:(existing[5]||existing[4]||''))),
    txt(pick('category',6),120),
    txt(pick('description',7),5000),
    p.price!==undefined?money(p.price):money(existing[8]),
    p.salePrice!==undefined?money(p.salePrice):money(existing[9]),
    p.stock!==undefined?Math.max(0,parseInt(p.stock||0,10)||0):Math.max(0,parseInt(existing[10]||0,10)||0),
    p.productionDays!==undefined?Math.max(0,parseInt(p.productionDays||0,10)||0):Math.max(0,parseInt(existing[11]||0,10)||0),
    p.shopeeUrl!==undefined?shopeeUrl(p.shopeeUrl):(existing[12]||''),
    txt(pick('scrapeStatus',13),120),
    p.scrapeAttemptAt!==undefined?(p.scrapeAttemptAt?new Date(p.scrapeAttemptAt):''):(existing[14]||''),
    txt(pick('detectedTitle',15),500),
    p.detectedPrice!==undefined?money(p.detectedPrice):money(existing[16]),
    p.detectedImage!==undefined?normUrl(p.detectedImage):(existing[17]||''),
    p.imageMain!==undefined?normUrl(p.imageMain):(existing[18]||''),
    p.image2!==undefined?normUrl(p.image2):(existing[19]||''),
    p.image3!==undefined?normUrl(p.image3):(existing[20]||''),
    txt(pick('adminNotes',21),2500),
    new Date()
  ];
  sh.getRange(row,1,1,23).setValues([vals]);
  [['heightCm',0],['widthCm',1],['depthCm',2]].forEach(x=>{
    if(p[x[0]]!==undefined)sh.getRange(row,dims[x[1]]).setValue(normalizedDims[x[0]]);
  });
  return productById(id);
}

function affiliates(){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Afiliados');
  if(!sh||sh.getLastRow()<2)return[];
  return sh.getRange(2,1,sh.getLastRow()-1,5).getValues().filter(r=>r[0]).map(r=>({
    code:String(r[0]),name:String(r[1]),rate:Number(r[2]),active:yes(r[3]),updatedAt:serial(r[4])
  }));
}
function needAffiliate(code){
  const a=affiliates().find(x=>x.code===String(code||''));
  if(!a||!a.active||!Number.isFinite(a.rate)||a.rate<0||a.rate>1000)throw new Error('Afiliado inexistente ou inativo.');
  return a;
}
function checkoutAffiliate(p){
  if(!p.affiliateCode)return null;
  const a=needAffiliate(p.affiliateCode);
  if(p.affiliateRate!==undefined&&p.affiliateRate!==null&&p.affiliateRate!==''&&Number(p.affiliateRate)!==a.rate){
    throw new Error('A taxa do afiliado mudou. Recarregue a página.');
  }
  return a;
}
function affiliatePrice(price,rate){return money(Number(price)*(100+Number(rate))/100)}
function saveAffiliate(a,mode){
  const code=String(a.code||'').trim(),name=txt(a.name,120),rate=Number(a.rate);
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(code)||!name||!Number.isFinite(rate)||rate<0||rate>1000||Math.round(rate*100)!==rate*100){
    throw new Error('Dados do afiliado inválidos.');
  }
  if(String(name).startsWith('='))throw new Error('Dados do afiliado inválidos.');
  const book=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=book.getSheetByName('Afiliados');
  if(!sh){
    sh=book.insertSheet('Afiliados');
    sh.getRange(1,1,1,5).setValues([['Código','Nome','Acréscimo (%)','Ativo','Atualizado em']]);
  }
  const row=findRow(sh,1,code);
  if(mode==='create'&&row)throw new Error('Este código já existe.');
  if(mode==='update'&&!row)throw new Error('Afiliado não encontrado.');
  const v=[code,name,rate,a.active===true?'Sim':'Não',new Date()];
  if(row)sh.getRange(row,1,1,5).setValues([v]);else sh.appendRow(v);
  return affiliates().find(x=>x.code===code);
}

function scrapeShopee(url){
  const u=shopeeUrl(url);
  if(!u)throw new Error('Informe um link válido da Shopee.');
  const r=UrlFetchApp.fetch(u,{method:'get',followRedirects:true,muteHttpExceptions:true,headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'pt-BR,pt;q=0.9'}});
  const status=r.getResponseCode(),html=r.getContentText().slice(0,1500000);
  if(status===403||status===429||html.toLowerCase().includes('captcha')){
    return{ok:false,blocked:true,status:'Bloqueado pela Shopee',httpStatus:status};
  }
  const meta=k=>{
    const e=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const m=html.match(new RegExp('<meta[^>]+(?:property|name)=["\\\']'+e+'["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']','i'));
    return m?m[1]:'';
  };
  const title=meta('og:title')||((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
  const image=meta('og:image'),description=meta('og:description'),price=money(meta('product:price:amount'));
  return{ok:Boolean(title||image||price),blocked:false,status:'Dados detectados',httpStatus:status,title:txt(title,500),price,image:normUrl(image),description:txt(description,5000),source:u};
}

/* Compatibilidade para testes e integrações antigas internas. */
function requireAdmin_(k){return needAdmin(k)}
function requireAffiliate_(code){return needAffiliate(code)}
function saveAffiliate_(a,mode){return saveAffiliate(a,mode)}
function productToObject_(r,h){return productObj(r,Array.isArray(h)?h:[])}
function ensureProductDimensions_(sh){return ensureDims(sh)}
function saveProduct_(p,mode){return saveProduct(p,mode)}
function allocateOrderId_(){return allocateOrderId()}
function upsertCustomer_(r){return upsertCustomer(r)}
function refreshAdminSheet_(){return true}
