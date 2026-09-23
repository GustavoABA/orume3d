import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { products } from '../data/products';

const WISHLIST_KEY = 'shoplite-wishlist';
const RECENT_KEY = 'shoplite-recent';
const RECENT_LIMIT = 8;

const VALID_PRODUCT_IDS = new Set(products.map((product) => product.id));

const normalizeProductIds = (ids: number[], limit?: number) => {
  let changed = false;
  const seen = new Set<number>();
  const normalized: number[] = [];

  for (const id of ids) {
    if (!VALID_PRODUCT_IDS.has(id) || seen.has(id)) {
      changed = true;
      continue;
    }

    seen.add(id);
    normalized.push(id);

    if (limit && normalized.length === limit) {
      if (normalized.length !== ids.length) {
        changed = true;
      }
      break;
    }
  }

  if (!changed && normalized.length === ids.length) {
    return ids;
  }

  return normalized;
};

export type PreferencesContextValue = {
  wishlist: number[];
  toggleWishlist: (productId: number) => boolean;
  isInWishlist: (productId: number) => boolean;
  recentlyViewed: number[];
  addRecentlyViewed: (productId: number) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useLocalStorage<number[]>(WISHLIST_KEY, []);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<number[]>(RECENT_KEY, []);
  const normalizedWishlist = useMemo(() => normalizeProductIds(wishlist), [wishlist]);
  const normalizedRecentlyViewed = useMemo(
    () => normalizeProductIds(recentlyViewed, RECENT_LIMIT),
    [recentlyViewed]
  );

  useEffect(() => {
    if (normalizedWishlist !== wishlist) {
      setWishlist(normalizedWishlist);
    }
  }, [wishlist, normalizedWishlist, setWishlist]);

  useEffect(() => {
    if (normalizedRecentlyViewed !== recentlyViewed) {
      setRecentlyViewed(normalizedRecentlyViewed);
    }
  }, [recentlyViewed, normalizedRecentlyViewed, setRecentlyViewed]);

  const value = useMemo<PreferencesContextValue>(() => {
    const toggleWishlist = (productId: number) => {
      if (!VALID_PRODUCT_IDS.has(productId)) {
        return false;
      }

      let addedToWishlist = false;
      setWishlist((prev) => {
        const base = normalizeProductIds(prev);
        const exists = base.includes(productId);
        addedToWishlist = !exists;

        if (exists) {
          return base.filter((id) => id !== productId);
        }

        return [...base, productId];
      });
      return addedToWishlist;
    };

    const isInWishlist = (productId: number) => normalizedWishlist.includes(productId);

    const addRecentlyViewed = (productId: number) => {
      if (!VALID_PRODUCT_IDS.has(productId)) {
        return;
      }

      setRecentlyViewed((prev) => {
        const base = normalizeProductIds(prev, RECENT_LIMIT);
        const withoutId = base.filter((id) => id !== productId);
        return [productId, ...withoutId].slice(0, RECENT_LIMIT);
      });
    };

    return {
      wishlist: normalizedWishlist,
      toggleWishlist,
      isInWishlist,
      recentlyViewed: normalizedRecentlyViewed,
      addRecentlyViewed,
    };
  }, [
    normalizedWishlist,
    normalizedRecentlyViewed,
    setWishlist,
    setRecentlyViewed,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
