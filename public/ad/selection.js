(() => {
  'use strict';
  const KEY = 'orume:ad-selection:v1';
  let state = { seen: [], previous: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved?.seen) && Array.isArray(saved?.previous)) state = saved;
  } catch { /* O sorteio também funciona sem armazenamento. */ }

  window.ORUME_AD_SELECTION = {
    pick(products, count) {
      const pool = [...new Map(products.map(product => [product.id, product])).values()];
      const available = new Set(pool.map(product => product.id));
      let seen = new Set(state.seen.filter(id => available.has(id)));
      const previous = new Set(state.previous);
      const selected = [];
      while (selected.length < Math.min(count, pool.length)) {
        const unused = pool.filter(product => !selected.some(item => item.id === product.id));
        let candidates = unused.filter(product => !seen.has(product.id));
        if (!candidates.length) { seen = new Set(); candidates = unused; }
        const different = candidates.filter(product => !previous.has(product.id));
        if (different.length) candidates = different;
        const product = candidates[Math.floor(Math.random() * candidates.length)];
        selected.push(product);
        seen.add(product.id);
      }
      state = { seen: [...seen], previous: selected.map(product => product.id) };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Cache opcional. */ }
      return selected;
    },
  };
})();
