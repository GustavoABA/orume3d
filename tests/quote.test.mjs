import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../src/components/quote/QuoteModal.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
const props = {name:'Teste local',phone:'19999999999',product:'Suporte',quantity:'2',cep:'13600000'};
function setup(t, post) {
 const Dialog = ({children}) => React.createElement('dialog', null, children);
 for (const name of ['Overlay','Panel','Title','Description']) Dialog[name] = React.forwardRef(({children,...rest},ref) => React.createElement('div',{...rest,ref},children));
 const exports = {};
 vm.runInNewContext(code,{exports,crypto:webcrypto,FormData:class {constructor(form){this.data=form.data;} get(key){return this.data[key]??null;}},require:id => {
  if(id==='@headlessui/react') return {Dialog};
  if(id.endsWith('/backend')) return {loadBackendConfig:async()=>({endpoint:'test'}),postBackend:post};
  if(id.endsWith('/whatsapp')) return {buildWhatsAppUrl:message=>'https://wa.me/5519989342212?text='+encodeURIComponent(message)};
  return require(id);
 }});
 let r;act(()=>{r=create(React.createElement(exports.default,{open:true,onClose(){}}));});
 t.after(()=>act(()=>r.unmount()));
 return {r,async submit(data=props,valid=true){await act(async()=>{await r.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{data,reportValidity:()=>valid}});});}};
}
test('first step never sends; success appears only with confirmed protocol and WhatsApp keyword',async t=>{
 const calls=[];const s=setup(t,async(_endpoint,payload)=>{calls.push(payload);return {ok:true,orderId:'0012'};});
 await s.submit();assert.equal(calls.length,0);
 await s.submit();assert.equal(calls.length,1);assert.equal(calls[0].quantity,'2');
 const link=s.r.root.findByType('a').props.href;
 const message=new URL(link).searchParams.get('text');assert.ok(message.includes('orume'));assert.ok(message.includes('0012'));
});
test('invalid CEP prevents sending and preserves the form',async t=>{
 let calls=0;const s=setup(t,async()=>{calls++;});await s.submit();await s.submit({...props,cep:'123'});
 assert.equal(calls,0);assert.equal(s.r.root.findAllByType('form').length,1);
});
test('failed confirmation keeps form and retries the same payload with the same ID',async t=>{
 const calls=[];const s=setup(t,async(_endpoint,payload)=>{calls.push(payload);throw new Error('Falha de rede');});
 await s.submit();await s.submit();await s.submit();assert.equal(calls.length,2);assert.equal(calls[0].siteId,calls[1].siteId);assert.equal(s.r.root.findAllByType('a').length,0);
});
test('missing order ID does not display WhatsApp continuation as success',async t=>{
 const s=setup(t,async()=>({ok:true}));await s.submit();await s.submit();assert.equal(s.r.root.findAllByType('a').length,0);
});
