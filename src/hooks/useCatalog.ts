import { useEffect, useMemo, useState } from 'react';
import { useAffiliate } from '../context/AffiliateContext';
import { priceForAffiliate } from '../lib/affiliate';
import { getCachedCatalog, loadCatalog } from '../lib/catalog';

export const useCatalog = () => {
  const affiliate = useAffiliate();
  const [initial] = useState(getCachedCatalog);
  const [products, setProducts] = useState(initial ?? []);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    loadCatalog().then(items => {
      if (!cancelled) { setProducts(items); setError(''); }
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Falha ao carregar catálogo.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const pricedProducts = useMemo(() => products.map(product => priceForAffiliate(product, affiliate)), [products, affiliate]);
  return { products: pricedProducts, loading, error };
};
