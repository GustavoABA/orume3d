import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source=await readFile(new URL('../backend/Orume_Backend_Atual.gs',import.meta.url),'utf8');
const helperSource=await readFile(new URL('../src/lib/affiliate.ts',import.meta.url),'utf8');
const helper=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(helperSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
function setup() {
 const sheets=new Map();
 function makeSheet(name){const rows=[];const sheet={rows,getName:()=>name,getMaxColumns:()=>40,getLastRow:()=>rows.length,setFrozenRows(){},appendRow(row){rows.push([...row]);},getRange(r,c,h=1,w=1){return {getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r+i-1]?.[c+j-1]??'')),setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{rows[r+i-1]??=[];rows[r+i-1][c+j-1]=v;}));},setValue(value){rows[r-1]??=[];rows[r-1][c-1]=value;},setFormula(){}};}};sheets.set(name,sheet);return sheet;}
 const ctx=vm.createContext({console,SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets.get(name),insertSheet:makeSheet})},Utilities:{formatDate:()=>'',getUuid:()=> 'uuid'},PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'secret'})}});
 vm.runInContext(source,ctx);
 ctx.getProducts_=()=>[{id:1,name:'Produto',price:80,salePrice:0,active:'Sim'},{id:2,name:'Promo',price:50,salePrice:14.9,active:'Sim'}];ctx.log_=()=>{};
 const checkouts=makeSheet('Checkouts');checkouts.rows.push([]);
 return {ctx,sheets,checkouts};
}
const affiliate={code:'afiliado-linux',name:'Linux',rate:20,active:true};
const payload={checkoutId:'CHK-test',name:'Teste',phone:'19999999999',cep:'13600000',affiliateCode:affiliate.code,affiliateRate:20,cart:[{id:1,name:'Tampered',unitPrice:96,quantity:2}],subtotal:192};
test('frontend rounds unit prices and applies markup to both normal and sale price',()=>{
 assert.equal(helper.affiliatePrice(80,20),96);assert.equal(helper.affiliatePrice(14.9,20),17.88);
 const p=helper.priceForAffiliate({price:14.9,originalPrice:50},affiliate);assert.equal(p.price,17.88);assert.equal(p.originalPrice,60);
 assert.equal(helper.priceForAffiliate(p,affiliate).price,17.88);assert.equal(helper.priceForAffiliate(p,null).price,14.9);
});
test('affiliate persistence creates sheet, rejects duplicate code, edits and deactivates',()=>{
 const {ctx,sheets}=setup();ctx.saveAffiliate_(affiliate,'create');assert.equal(sheets.get('Afiliados').rows[1][2],20);
 assert.throws(()=>ctx.saveAffiliate_(affiliate,'create'),/existe/);
 ctx.saveAffiliate_({...affiliate,rate:12.5},'update');assert.equal(ctx.requireAffiliate_(affiliate.code).rate,12.5);
 ctx.saveAffiliate_({...affiliate,active:false},'update');assert.throws(()=>ctx.requireAffiliate_(affiliate.code),/inativo/);
});
test('server rejects invalid rates and codes',()=>{
 for(const change of [{rate:-1},{rate:Infinity},{rate:1001},{rate:1.234},{code:'<script>'},{name:'=FORMULA()'}]) {const {ctx}=setup();assert.throws(()=>ctx.saveAffiliate_({...affiliate,...change},'create'));}
});
test('checkout recomputes prices from sheet and stores affiliate snapshot and markup',()=>{
 const {ctx,checkouts}=setup();ctx.saveAffiliate_(affiliate,'create');ctx.createCheckout_(payload);
 const row=checkouts.rows[1];assert.equal(row[9],192);assert.equal(row[22],affiliate.code);assert.equal(row[23],20);assert.equal(row[24],32);
 assert.equal(JSON.parse(row[8])[0].name,'Produto');assert.equal(JSON.parse(row[8])[0].basePrice,80);
 ctx.saveAffiliate_({...affiliate,rate:30},'update');ctx.createCheckout_(payload);assert.equal(checkouts.rows.length,2);assert.equal(row[23],20);
});
test('checkout rejects changed rate, fake price, fake total, inactive affiliate and unavailable products',()=>{
 for(const change of [{affiliateRate:2},{subtotal:1},{cart:[{id:1,unitPrice:1,quantity:2}]},{cart:[{id:1,unitPrice:96,quantity:0}]},{cart:[{id:999,unitPrice:96,quantity:2}]}]) {
  const {ctx,checkouts}=setup();ctx.saveAffiliate_(affiliate,'create');assert.throws(()=>ctx.createCheckout_({...payload,...change}));assert.equal(checkouts.rows.length,1);
 }
 const {ctx}=setup();ctx.saveAffiliate_({...affiliate,active:false},'create');assert.throws(()=>ctx.createCheckout_(payload),/inativo/);
});
test('saving affiliate requires the existing admin key via the public handler',()=>{
 const {ctx}=setup();assert.throws(()=>ctx.requireAdmin_('wrong'),/negado/);assert.doesNotThrow(()=>ctx.requireAdmin_('secret'));
 const route=source.slice(source.indexOf('function doPost'),source.indexOf('function onOpen'));assert.ok(route.indexOf('requireAdmin_')<route.indexOf('adminSaveAffiliate'));
});
test('both Apps Script deployment copies are identical',async()=>{assert.equal(await readFile(new URL('../backend/google-apps-script/Code.gs',import.meta.url),'utf8'),source);});
test('quote writes affiliate snapshot without inventing a price',()=>{
 const {ctx,sheets}=setup();ctx.saveAffiliate_(affiliate,'create');
 const orders={rows:[[]],getLastRow(){return this.rows.length;},getMaxColumns:()=>40,getRange(r,c,h=1,w=1){return {getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>orders.rows[r+i-1]?.[c+j-1]??'')),setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{orders.rows[r+i-1]??=[];orders.rows[r+i-1][c+j-1]=v;}));},setFormula(){}};},appendRow(row){this.rows.push(row);}};
 sheets.set('Pedidos',orders);ctx.allocateOrderId_=()=>12;ctx.upsertCustomer_=()=>{};ctx.refreshAdminSheet_=()=>{};
 ctx.createOrderFromQuote_({...payload,siteId:'SITE-1',product:'Sob medida',quantity:2});
 assert.equal(orders.rows[1][32],affiliate.code);assert.equal(orders.rows[1][33],20);assert.equal(orders.rows[1][34],'');assert.equal(orders.rows[1][10],affiliate.code);
});
test('affiliate columns never overwrite unrelated existing headers',()=>{
 const {ctx,checkouts}=setup();checkouts.rows[0][22]='Minha coluna';ctx.saveAffiliate_(affiliate,'create');assert.throws(()=>ctx.createCheckout_(payload),/ocupadas/);assert.equal(checkouts.rows.length,1);assert.equal(checkouts.rows[0][22],'Minha coluna');
});
