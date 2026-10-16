import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../backend/Orume_Backend_Atual.gs',import.meta.url),'utf8');
function setup(){
 const rows=[];
 const ctx=vm.createContext({Utilities:{getUuid:()=> 'test-id'},console});
 vm.runInContext(source,ctx);
 ctx.sheet=()=>({appendRow:row=>rows.push(row),getLastRow:()=>rows.length});
 ctx.findRow=()=>0;ctx.checkoutAffiliate=()=>null;
 ctx.products=()=>[{id:1,active:'Sim',name:'Peça',price:20,salePrice:0}];
 ctx.allocateOrderId=()=>42;ctx.ensureAffiliateCols=()=>{};
 ctx.setBalanceFormula=()=>{};ctx.upsertCustomer=()=>{};ctx.log=()=>{};
 return {ctx,rows};
}
const payload={checkoutId:'CHK-regression',name:'Teste local',phone:'19999999999',cart:[{id:1,quantity:2}],subtotal:40};
test('quick checkout stores an order with only visible contact fields and no invented address',()=>{
 const {ctx,rows}=setup();const result=ctx.createCheckout(payload);
 assert.equal(result.ok,true);assert.equal(result.checkoutId,payload.checkoutId);
 assert.equal(rows.length,1);assert.equal(rows[0][6],payload.name);assert.equal(rows[0][7],payload.phone);
 assert.equal(rows[0][8],'');assert.equal(rows[0][9],'');assert.equal(rows[0][22],40);
});
test('quick checkout retains validation of name, phone, cart and current prices',()=>{
 for(const [change,error] of [[{name:''},/Nome/],[{phone:'123'},/WhatsApp/],[{cart:[]},/Carrinho/],[{subtotal:1},/preço/]]){
  const {ctx,rows}=setup();assert.throws(()=>ctx.createCheckout({...payload,...change}),error);assert.equal(rows.length,0);
 }
});
