import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source=await readFile(new URL('../backend/Orume_Backend_Atual.gs',import.meta.url),'utf8');
const helperSource=await readFile(new URL('../src/lib/affiliate.ts',import.meta.url),'utf8');
const helper=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(helperSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));

function setup(){
  const sheets=new Map();
  let uuid=0;
  function makeSheet(name,initialRows=[]){
    const rows=initialRows.map(row=>[...row]);
    const sheet={
      rows,
      getName:()=>name,
      getMaxColumns:()=>50,
      getLastColumn:()=>Math.max(1,...rows.map(row=>row.length)),
      getLastRow:()=>rows.length,
      insertColumnsAfter(){},
      deleteRow(row){rows.splice(row-1,1);},
      appendRow(row){rows.push([...row]);},
      getRange(r,c,h=1,w=1){
        return{
          getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r+i-1]?.[c+j-1]??'')),
          setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{rows[r+i-1]??=[];rows[r+i-1][c+j-1]=v;}));},
          setValue(value){rows[r-1]??=[];rows[r-1][c-1]=value;},
          setFormula(){},
        };
      },
    };
    sheets.set(name,sheet);
    return sheet;
  }

  const productHeaders=Array.from({length:23},(_,i)=>`Col ${i+1}`);
  const product1=[1,'SKU-1','Sim','Não','Produto','produto','Teste','',80,0,0,0,'','','','','','','','','','',new Date()];
  const product2=[2,'SKU-2','Sim','Não','Promo','promo','Teste','',50,14.9,0,0,'','','','','','','','','','',new Date()];
  const orders=makeSheet('Pedidos',[Array(35).fill('')]);
  makeSheet('Produtos',[productHeaders,product1,product2]);
  makeSheet('Clientes',[Array(11).fill('')]);
  makeSheet('Logs',[Array(8).fill('')]);
  makeSheet('Histórico',[Array(35).fill('')]);

  const book={getSheetByName:name=>sheets.get(name),insertSheet:name=>makeSheet(name)};
  const ctx=vm.createContext({
    console,
    SpreadsheetApp:{openById:()=>book},
    Utilities:{formatDate:()=>'',getUuid:()=>`uuid-${++uuid}`},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'secret'})},
  });
  vm.runInContext(source,ctx);
  return{ctx,sheets,orders};
}

const affiliate={code:'afiliado-linux',name:'Linux',rate:20,active:true};
const payload={checkoutId:'CHK-test',name:'Teste',phone:'19999999999',affiliateCode:affiliate.code,affiliateRate:20,cart:[{id:1,name:'Tampered',unitPrice:1,quantity:2}],subtotal:192};

test('frontend rounds unit prices and applies markup to both normal and sale price',()=>{
  assert.equal(helper.affiliatePrice(80,20),96);
  assert.equal(helper.affiliatePrice(14.9,20),17.88);
  const p=helper.priceForAffiliate({price:14.9,originalPrice:50},affiliate);
  assert.equal(p.price,17.88);
  assert.equal(p.originalPrice,60);
  assert.equal(helper.priceForAffiliate(p,affiliate).price,17.88);
  assert.equal(helper.priceForAffiliate(p,null).price,14.9);
});

test('affiliate persistence creates sheet, rejects duplicate code, edits and deactivates',()=>{
  const {ctx,sheets}=setup();
  ctx.saveAffiliate(affiliate,'create');
  assert.equal(sheets.get('Afiliados').rows[1][2],20);
  assert.throws(()=>ctx.saveAffiliate(affiliate,'create'),/existe/);
  ctx.saveAffiliate({...affiliate,rate:12.5},'update');
  assert.equal(ctx.needAffiliate(affiliate.code).rate,12.5);
  ctx.saveAffiliate({...affiliate,active:false},'update');
  assert.throws(()=>ctx.needAffiliate(affiliate.code),/inativo/);
});

test('server rejects invalid affiliate rates, codes and formula-like names',()=>{
  for(const change of [{rate:-1},{rate:Infinity},{rate:1001},{rate:1.234},{code:'<script>'},{name:'=FORMULA()'}]){
    const {ctx}=setup();
    assert.throws(()=>ctx.saveAffiliate({...affiliate,...change},'create'));
  }
});

test('checkout recomputes prices, writes directly to Pedidos and keeps affiliate snapshot',()=>{
  const {ctx,orders}=setup();
  ctx.saveAffiliate(affiliate,'create');
  const result=ctx.createCheckout(payload);
  assert.equal(result.ok,true);
  assert.equal(result.status,'Aguardando contato');
  const row=orders.rows[1];
  assert.equal(row[4],'Aguardando contato');
  assert.equal(row[6],'Teste');
  assert.equal(row[7],'19999999999');
  assert.equal(row[11],'2x Produto');
  assert.equal(row[22],192);
  assert.equal(row[32],affiliate.code);
  assert.equal(row[33],20);
  assert.equal(row[34],32);
  assert.match(row[18],/2x Produto/);

  ctx.saveAffiliate({...affiliate,rate:30},'update');
  const duplicate=ctx.createCheckout(payload);
  assert.equal(duplicate.duplicate,true);
  assert.equal(orders.rows.length,2);
  assert.equal(row[33],20);
});

test('checkout ignores client unit price but rejects changed totals, changed affiliate rate and unavailable items',()=>{
  {
    const {ctx,orders}=setup();
    ctx.saveAffiliate(affiliate,'create');
    ctx.createCheckout({...payload,cart:[{id:1,unitPrice:1,quantity:2}]});
    assert.equal(orders.rows[1][22],192);
  }
  for(const change of [
    {checkoutId:'CHK-rate',affiliateRate:2},
    {checkoutId:'CHK-total',subtotal:1},
    {checkoutId:'CHK-qty',cart:[{id:1,unitPrice:96,quantity:0}]},
    {checkoutId:'CHK-missing',cart:[{id:999,unitPrice:96,quantity:2}]},
  ]){
    const {ctx,orders}=setup();
    ctx.saveAffiliate(affiliate,'create');
    assert.throws(()=>ctx.createCheckout({...payload,...change}));
    assert.equal(orders.rows.length,1);
  }
  const {ctx}=setup();
  ctx.saveAffiliate({...affiliate,active:false},'create');
  assert.throws(()=>ctx.createCheckout({...payload,checkoutId:'CHK-inactive'}),/inativo/);
});

test('saving affiliate remains behind the admin key in the public POST handler',()=>{
  const {ctx}=setup();
  assert.throws(()=>ctx.needAdmin('wrong'),/negado/);
  assert.doesNotThrow(()=>ctx.needAdmin('secret'));
  const route=source.slice(source.indexOf('function doPost'),source.indexOf('function parseBody'));
  assert.ok(route.indexOf('needAdmin(p.adminKey)')<route.indexOf("a==='adminSaveAffiliate'"));
});

test('both Apps Script deployment copies are identical',async()=>{
  assert.equal(await readFile(new URL('../backend/google-apps-script/Code.gs',import.meta.url),'utf8'),source);
});

test('quote writes affiliate snapshot without inventing a price',()=>{
  const {ctx,orders}=setup();
  ctx.saveAffiliate(affiliate,'create');
  ctx.createQuote({
    siteId:'SITE-1',name:'Teste',phone:'19999999999',cep:'13600000',product:'Sob medida',quantity:2,
    affiliateCode:affiliate.code,affiliateRate:20,
  });
  const row=orders.rows[1];
  assert.equal(row[10],affiliate.code);
  assert.equal(row[32],affiliate.code);
  assert.equal(row[33],20);
  assert.equal(row[34],'');
  assert.equal(row[22],0);
});

test('affiliate columns never overwrite unrelated existing headers',()=>{
  const {ctx,orders}=setup();
  orders.rows[0][32]='Minha coluna';
  ctx.saveAffiliate(affiliate,'create');
  assert.throws(()=>ctx.createCheckout({...payload,checkoutId:'CHK-columns'}),/ocupadas/);
  assert.equal(orders.rows.length,1);
  assert.equal(orders.rows[0][32],'Minha coluna');
});
