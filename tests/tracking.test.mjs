import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../backend/google-apps-script/Code.gs', import.meta.url), 'utf8');
const mirror = await readFile(new URL('../backend/Orume_Backend_Atual.gs', import.meta.url), 'utf8');

function fakeSheet(rows) {
  return {
    rows,
    getLastRow() { return rows.length; },
    getLastColumn() { return Math.max(...rows.map(row => row.length)); },
    getMaxColumns() { return Math.max(...rows.map(row => row.length)); },
    insertColumnsAfter(index, count) { rows.forEach(row => row.splice(index, 0, ...Array(count).fill(''))); },
    appendRow(values) { rows.push([...values]); },
    getRange(row, column, height = 1, width = 1) {
      const read = () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => rows[row-1+i]?.[column-1+j] ?? ''));
      return {
        getValues: read,
        getValue() { return read()[0][0]; },
        setValue(value) { if (!rows[row-1]) rows[row-1] = []; rows[row-1][column-1] = value; },
        setValues(values) { values.forEach((line,i) => line.forEach((value,j) => { rows[row-1+i][column-1+j] = value; })); },
        clearContent() { for(let i=0;i<height;i++) for(let j=0;j<width;j++) rows[row-1+i][column-1+j] = ''; },
      };
    },
  };
}

function setup() {
  const token = 'a'.repeat(64);
  const headers = Array.from({ length: 36 }, (_, i) => i === 35 ? 'Token de acompanhamento' : 'Coluna ' + i);
  const order = Array(36).fill('');
  Object.assign(order, { 0: 42, 1: 'CHK-42', 4: 'Aguardando contato', 5: 'Normal', 6: 'Cliente Teste', 7: '11999999999', 11: 'Chaveiro', 12: 2, 22: 40, 23: 10, 25: 'PIX', 27: 'BR123', 31: 'UID-42', 35: token });
  const products = Array.from({length:23},(_,i)=>'Coluna '+i);
  const productRow = Array(23).fill('');
  productRow[0]=7; productRow[2]='Sim'; productRow[4]='Chaveiro';
  const database = {
    Pedidos: fakeSheet([headers,order]),
    'Histórico': fakeSheet([headers]),
    Produtos: fakeSheet([products,productRow]),
    Logs: fakeSheet([['Data']]),
    Clientes: fakeSheet([['ID','Nome','WhatsApp','','','','','Atualizado','Quantidade']]),
  };
  const ctx = { console: { error() {} },
    SpreadsheetApp: { openById() { return {getSheetByName(name){return database[name];}}; } },
    PropertiesService: { getScriptProperties() { return { getProperty(){ return 'secret'; } }; } },
    Utilities: { getUuid() { return '12345678-1234-4123-8123-123456789abc'; }, formatDate(d){return String(d);} },
  };
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return { ctx, token, database };
}

test('the canonical Apps Script and mirror stay identical', () => assert.equal(source,mirror));

test('public tracking excludes sensitive fields and rejects invalid tokens', () => {
  const {ctx,token}=setup();
  const result=ctx.customerOrder_(token);
  assert.equal(result.ok,true);
  assert.equal(result.order.name,'Cliente Teste');
  assert.equal(result.order.tracking,'BR123');
  for(const field of ['amount','paid','paymentMethod','notes','uid','trackingToken','siteId']) assert.equal(field in result.order,false);
  assert.throws(()=>ctx.customerOrder_('42'),/inválido ou encerrado/);
});

test('customer can edit only allowed fields; completed links are revoked', () => {
  const {ctx,token,database}=setup();
  assert.throws(()=>ctx.customerUpdateOrder_({token,changes:{status:'Concluído'}}),/não permitido/);
  assert.throws(()=>ctx.customerUpdateOrder_({token,changes:{cep:'123'}}),/CEP inválido/);
  const updated=ctx.customerUpdateOrder_({token,changes:{name:'Nome Atualizado',city:'Leme / SP',cleanService:'Sim'}});
  assert.equal(updated.order.name,'Nome Atualizado');
  assert.equal(updated.order.city,'Leme / SP');
  assert.equal(updated.order.cleanService,'Sim');
  assert.equal(database.Pedidos.rows[1][4],'Aguardando contato');
  ctx.completeOrder(42);
  assert.equal(database.Pedidos.rows[1][35],'');
  assert.throws(()=>ctx.customerOrder_(token),/inválido ou encerrado/);
});

test('only completed orders may be removed and removed rows stay as sync tombstones', () => {
  const {ctx,database}=setup();
  assert.throws(()=>ctx.deleteOrder_(42),/Somente pedidos concluídos/);
  ctx.completeOrder(42);
  assert.equal(ctx.deleteOrder_(42).ok,true);
  assert.equal(database.Pedidos.rows[1][4],'Excluído');
  assert.equal(database['Histórico'].rows.length,2);
  assert.equal(ctx.listOrders().length,0);
});

test('deleting product hides it from catalogue and preserves product ID',()=>{
  const {ctx,database}=setup();
  assert.equal(ctx.publicCatalog().length,1);
  assert.equal(ctx.deleteProduct_(7).ok,true);
  assert.equal(ctx.publicCatalog().length,0);
  assert.equal(ctx.products().length,0);
  assert.equal(database.Produtos.rows[1][0],7);
  assert.equal(database.Produtos.rows[1][2],'Excluído');
});
