import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/orderImages.ts',import.meta.url),'utf8');
const {orderImageItems}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText).toString('base64'));
const products=[{name:'Vaso + base',imageMain:'https://example.com/vaso.jpg'},{name:'Suporte',imageMain:'https://example.com/suporte.jpg'}];
test('images follow each checkout item using full details, even with plus signs or truncated summary',()=>{
 const items=orderImageItems({product:'2x Vaso + ba',description:'2x Vaso + base — R$ 100,00\n1x Suporte — R$ 30,00',quantity:3},products);
 assert.deepEqual(items.map(i=>[i.name,i.quantity,i.images[0]]),[['Vaso + base',2,products[0].imageMain],['Suporte',1,products[1].imageMain]]);
});
test('quotes and legacy summaries match exact names only',()=>{
 assert.equal(orderImageItems({product:'Suporte',description:'Personalizar em azul',quantity:2},products)[0].images[0],products[1].imageMain);
 assert.equal(orderImageItems({product:'1x Suporte + 2x Vaso + base',description:'',quantity:3},products).length,2);
 assert.deepEqual(orderImageItems({product:'Suporte maior',description:'',quantity:1},products)[0].images,[]);
});
test('ambiguous products and missing images show no incorrect photo; alternate images are retained',()=>{
 assert.deepEqual(orderImageItems({product:'Suporte',description:'',quantity:1},[...products,products[1]])[0].images,[]);
 assert.deepEqual(orderImageItems({product:'Peça',description:'',quantity:1},[{name:'Peça',imageMain:'javascript:alert(1)',image2:'/piece.webp'}])[0].images,['/piece.webp']);
});
