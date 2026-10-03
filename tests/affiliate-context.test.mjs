import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(await readFile(new URL('../src/context/AffiliateContext.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
async function mount(t,{query='',stored='',response,fail=false,path='/'}={}) {
 let value=stored;const calls=[];const exports={};let context;
 vm.runInNewContext(code,{exports,URLSearchParams,window:{location:{pathname:path,search:query}},sessionStorage:{getItem:()=>value,setItem:(_key,v)=>{value=v;},removeItem:()=>{value='';}},require:id=>id.endsWith('/backend')?{loadBackendConfig:async()=>({endpoint:'test'}),jsonp:async(_endpoint,params)=>{calls.push(params);if(fail)throw Error('network');return response;}}:require(id)});
 function Consumer(){context=exports.useAffiliate();return React.createElement('span',null,'Catalog ready');}
 let r;await act(async()=>{r=create(React.createElement(exports.AffiliateProvider,null,React.createElement(Consumer)));});t.after(()=>act(()=>r.unmount()));
 return {r,calls,get value(){return value;},get context(){return context;}};
}
const affiliate={code:'afiliado-linux',name:'Linux',rate:20,active:true};
test('affiliate URL overrides prior session; resolved backend rate is used',async t=>{
 const s=await mount(t,{query:'?afiliado=afiliado-linux&rate=999',stored:'previous',response:{ok:true,affiliate}});
 assert.equal(s.value,affiliate.code);assert.equal(s.context.rate,20);assert.equal(s.calls[0].code,affiliate.code);
});
test('checkout navigation validates saved affiliate again',async t=>{
 const s=await mount(t,{stored:affiliate.code,path:'/checkout/',response:{ok:true,affiliate}});assert.equal(s.context.rate,20);assert.equal(s.calls.length,1);
});
test('explicit empty affiliate clears attribution and serves ordinary prices',async t=>{
 const s=await mount(t,{stored:affiliate.code,query:'?afiliado='});assert.equal(s.value,'');assert.equal(s.context,null);assert.equal(s.calls.length,0);
});
test('invalid or failing affiliate blocks catalog instead of silently using base prices',async t=>{
 for(const options of [{fail:true},{response:{ok:false}},{response:{ok:true,affiliate:{...affiliate,active:false}}},{response:{ok:true,affiliate:{...affiliate,rate:-1}}}]){
 const s=await mount(t,{query:'?afiliado=afiliado-linux',...options});assert.equal(s.r.root.findAllByType('span').length,0);assert.equal(s.r.root.findAllByProps({role:'alert'}).length,1);
 }
});
test('ordinary visits and admin do not depend on affiliate endpoint',async t=>{
 const ordinary=await mount(t);assert.equal(ordinary.calls.length,0);
 const admin=await mount(t,{path:'/admin',stored:affiliate.code});assert.equal(admin.calls.length,0);
});
