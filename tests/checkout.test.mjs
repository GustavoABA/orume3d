import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../src/pages/Checkout.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
const fields={name:'Teste local',phone:'19999999999',cep:'13600000',city:'Leme/SP'};
function setup(t, success) {
 let resets=0; const exports={};
 const motion=new Proxy({}, {get:(_target,tag)=>tag});
 vm.runInNewContext(code,{exports,console,FormData:class {get(key){return fields[key]??null;}},require:id=>{
  if(id==='framer-motion') return {motion};
  if(id.endsWith('/CartContext')) return {useCart:()=>({items:[{id:5,name:'Produto',quantity:1,price:80}],subtotal:80,totalItems:1,resetCart(){resets++;}})};
  if(id.endsWith('/backend')) return {loadBackendConfig:async()=>({endpoint:'test'}),postBackend:async(_url,payload)=>{if(!success)throw new Error('Erro de gravação');return {ok:true,checkoutId:payload.checkoutId};}};
  if(id.endsWith('/format'))return {formatBRL:n=>`R$ ${n}`};
  if(id.endsWith('/whatsapp')) return {buildWhatsAppUrl:text=>'https://wa.me/5519989342212?text='+encodeURIComponent(text+'\n\norume')};
  return require(id);
 }});
 let r;act(()=>{r=create(React.createElement(exports.default));});t.after(()=>act(()=>r.unmount()));
 return {r,get resets(){return resets;},async submit(){await act(async()=>{await r.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{reportValidity:()=>true}});});}};
}
test('checkout waits for explicit WhatsApp continuation and preserves cart until then',async t=>{
 const s=setup(t,true);await s.submit();assert.equal(s.resets,0);
 const link=s.r.root.findAllByType('a').find(node=>String(node.props.href).startsWith('https://wa.me/'));
 assert.ok(link);assert.ok(new URL(link.props.href).searchParams.get('text').includes('orume'));
 act(()=>link.props.onClick());assert.equal(s.resets,1);
});
test('failed checkout does not show WhatsApp continuation or clear cart',async t=>{
 const s=setup(t,false);await s.submit();assert.equal(s.resets,0);
 assert.equal(s.r.root.findAllByType('a').filter(node=>String(node.props.href).startsWith('https://wa.me/')).length,0);
});
