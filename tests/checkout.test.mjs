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

function setup(t, success, affiliate = null) {
  const calls=[];
  let resets=0;
  const exports={};
  const motion=new Proxy({}, {get:(_target,tag)=>tag});
  const storage=new Map([['orume-customer-contact',JSON.stringify({name:'Teste local',phone:'19999999999'})]]);
  const localStorage={
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key),
  };

  vm.runInNewContext(code,{
    exports,
    console,
    window:{localStorage},
    require:id=>{
      if(id==='framer-motion') return {motion};
      if(id.endsWith('/CartContext')) return {useCart:()=>({items:[{id:5,name:'Produto',quantity:1,price:80,image:''}],subtotal:80,totalItems:1,resetCart(){resets++;}})};
      if(id.endsWith('/backend')) return {
        loadBackendConfig:async()=>({endpoint:'test'}),
        postBackend:async(_url,payload)=>{
          calls.push(payload);
          if(!success)throw new Error('Erro de gravação');
          return {ok:true,checkoutId:payload.checkoutId,orderId:'0042',message:'Pedido registrado.'};
        },
      };
      if(id.endsWith('/format'))return {formatBRL:n=>`R$ ${n}`};
      if(id.endsWith('/AffiliateContext')) return {useAffiliate:()=>affiliate};
      return require(id);
    },
  });

  let r;
  act(()=>{r=create(React.createElement(exports.default));});
  t.after(()=>act(()=>r.unmount()));
  return {
    r,
    calls,
    storage,
    get resets(){return resets;},
    async submit(){
      await act(async()=>{
        await r.root.findByType('form').props.onSubmit({preventDefault(){}});
      });
    },
  };
}

const renderedText = renderer => JSON.stringify(renderer.toJSON());

test('successful checkout registers the order, clears the cart and shows contact confirmation',async t=>{
  const s=setup(t,true);
  await s.submit();
  assert.equal(s.calls.length,1);
  assert.equal(s.calls[0].action,'createCheckout');
  assert.equal(s.calls[0].name,'Teste local');
  assert.equal(s.calls[0].phone,'19999999999');
  assert.equal('cep' in s.calls[0],false);
  assert.equal('city' in s.calls[0],false);
  assert.equal(s.resets,1);
  const text=renderedText(s.r);
  assert.match(text,/Pedido registrado com sucesso/);
  assert.match(text,/0042/);
  assert.match(text,/entrar em contato pelo WhatsApp informado/);
  assert.equal(s.r.root.findAllByType('a').some(node=>String(node.props.href||'').startsWith('https://wa.me/')),false);
  assert.deepEqual(JSON.parse(s.storage.get('orume-customer-contact')),{name:'Teste local',phone:'19999999999'});
});

test('failed checkout keeps the cart and shows the backend error',async t=>{
  const s=setup(t,false);
  await s.submit();
  assert.equal(s.resets,0);
  assert.equal(s.r.root.findAllByType('form').length,1);
  assert.match(renderedText(s.r),/Erro de gravação/);
  assert.equal(s.r.root.findAllByType('a').some(node=>String(node.props.href||'').startsWith('https://wa.me/')),false);
});

test('affiliate code and rate reach the direct site checkout without WhatsApp continuation',async t=>{
  const s=setup(t,true,{code:'afiliado-linux',rate:20});
  await s.submit();
  assert.equal(s.calls[0].affiliateCode,'afiliado-linux');
  assert.equal(s.calls[0].affiliateRate,20);
  assert.equal(s.resets,1);
  assert.equal(s.r.root.findAllByType('a').some(node=>String(node.props.href||'').startsWith('https://wa.me/')),false);
});
