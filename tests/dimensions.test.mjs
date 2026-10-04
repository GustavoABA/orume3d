import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const code=await readFile(new URL('../backend/Orume_Backend_Atual.gs',import.meta.url),'utf8');
const ctx=vm.createContext({});vm.runInContext(code,ctx);
const source=await readFile(new URL('../src/lib/productDimensions.ts',import.meta.url),'utf8');
const {productDimensions}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
test('dimensions accept decimals and blanks and reject malformed values',()=>{
 assert.equal(ctx.normalizeDimension_('15,5'),15.5);assert.equal(ctx.normalizeDimension_(''), '');
 for(const value of [-1,0,'abc','1.234',Infinity,10001])assert.throws(()=>ctx.normalizeDimension_(value));
});
test('legacy rows have no invented dimensions and fields are read by header',()=>{
 assert.equal(ctx.productToObject_([1]).heightCm,'');
 const p=ctx.productToObject_([15.5,10,8],['Altura (cm)','Largura (cm)','Profundidade (cm)']);assert.equal(p.heightCm,15.5);assert.equal(p.widthCm,10);assert.equal(p.depthCm,8);
});
test('dimension labels are unambiguous; absent values are hidden',()=>{
 assert.equal(productDimensions({}),'');assert.equal(productDimensions({heightCm:15.5,widthCm:10}),'Altura: 15,5 cm · Largura: 10 cm');assert.equal(productDimensions({heightCm:0,depthCm:NaN}),'');
});
test('new columns preserve existing extra headers and reuse dimension headers',()=>{
 const headers=Array.from({length:25},(_,i)=>'Existing '+i);headers[23]='Largura (cm)';
 const sheet={getLastColumn:()=>headers.length,getMaxColumns:()=>40,getRange(_r,c,_h,w){return {getValues:()=>[headers.slice(0,w)],setValue(value){headers[c-1]=value;}};}};
 const columns=ctx.ensureProductDimensions_(sheet);assert.deepEqual(Array.from(columns),[26,24,27]);assert.equal(headers[24],'Existing 24');assert.deepEqual(Array.from(ctx.ensureProductDimensions_(sheet)),[26,24,27]);
});
test('save product persists, preserves omitted dimensions and allows explicit clearing',()=>{
 const rows=[Array.from({length:23},(_,i)=>'Header '+i),[1,'sku','Sim','Não','Peça']];
 const sheet={getLastRow:()=>rows.length,getLastColumn:()=>rows[0].length,getMaxColumns:()=>40,getMaxRows:()=>100,getRange(r,c,h=1,w=1){return {getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r+i-1]?.[c+j-1]??'')),setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{rows[r+i-1]??=[];rows[r+i-1][c+j-1]=v;}));},setValue(value){rows[r-1]??=[];rows[r-1][c-1]=value;}};}};
 const scope=vm.createContext({CacheService:{getScriptCache:()=>({remove(){}})},Utilities:{formatDate:()=>''}});vm.runInContext(code,scope);scope.getSheet_=()=>sheet;scope.log_=()=>{};
 let p=scope.saveProduct_({id:1,name:'Peça',heightCm:'15,5',widthCm:10,depthCm:8},'update');assert.equal(p.heightCm,15.5);assert.equal(p.depthCm,8);
 p=scope.saveProduct_({id:1,name:'Peça editada',heightCm:''},'update');assert.equal(p.heightCm,'');assert.equal(p.widthCm,10);assert.equal(p.depthCm,8);
 assert.throws(()=>scope.saveProduct_({id:1,name:'Não salvar',heightCm:-1},'update'));assert.equal(rows[1][4],'Peça editada');
});
