import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const code = await readFile(new URL('../public/ad/selection.js', import.meta.url), 'utf8');
function load(storage = {}, random = Math.random) {
  const ctx = vm.createContext({ window: {}, Math: { random, min: Math.min, floor: Math.floor }, localStorage: {
    getItem: key => storage[key], setItem: (key, value) => { storage[key] = value; },
  } });
  vm.runInContext(code, ctx);
  return ctx.window.ORUME_AD_SELECTION.pick;
}
const pool = Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1), image: '/'+i+'.jpg' }));
test('ten ads cover thirty products without repeating; reload preserves progress', () => {
  const storage = {};
  const ids = [];
  for (let i = 0; i < 10; i++) ids.push(...load(storage)(pool, 3).map(p => p.id));
  assert.equal(new Set(ids).size, 30);
  const next = load(storage)(pool, 3).map(p => p.id);
  assert.ok(next.every(id => !ids.slice(-3).includes(id)));
});
test('selection uses randomness instead of catalog order', () => {
  assert.notDeepEqual(Array.from(load({}, () => 0)(pool, 3), p => p.id), Array.from(load({}, () => .99)(pool, 3), p => p.id));
});
test('small, empty and duplicate catalogs never repeat a product within one ad', () => {
  const pick = load();
  assert.equal(pick([], 3).length, 0);
  assert.equal(pick([pool[0], pool[0]], 3).length, 1);
  for (let i = 0; i < 20; i++) {
    const ids = pick(pool.slice(0, 5), 3).map(p => p.id);
    assert.equal(new Set(ids).size, 3);
  }
});
test('removed products leave the rotation and new products enter it', () => {
  const pick = load({}, () => 0);
  pick(pool, 3);
  const changed = [pool[4], { id: 'new' }];
  assert.deepEqual(new Set(pick(changed, 3).map(p => p.id)), new Set(['5', 'new']));
});
test('blocked storage does not break rotation', () => {
  const ctx = vm.createContext({ window: {}, localStorage: { getItem() { throw Error(); }, setItem() { throw Error(); } } });
  vm.runInContext(code, ctx);
  const pick = ctx.window.ORUME_AD_SELECTION.pick;
  const first = pick(pool, 3);
  assert.ok(pick(pool, 3).every(p => !first.some(item => item.id === p.id)));
});
