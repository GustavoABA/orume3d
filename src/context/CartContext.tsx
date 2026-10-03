import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Product } from '../data/products';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  source?: 'Shopee' | 'Interno';
  shopeeUrl?: string;
};

const TAX_RATE = 0;
const STORAGE_KEY = 'orume-cart';
const MAX_QUANTITY = 99;

const normalizeImageUrl = (value: string) => {
  let url = String(value || '').trim();
  if (!url) return '/brand/orume-mark.webp';
  url = url.replace(/^http:\/\//i, 'https://');
  url = url.replace(/^https:\/\/gustavoaba\.github\.io\/orume3d\//i, 'https://orume.com.br/');
  url = url.replace(/^\/orume3d\//i, '/');
  return url;
};

const normalizeStoredItems = (items: CartItem[]) =>
  Array.isArray(items)
    ? items.map((item) => ({ ...item, image: normalizeImageUrl(item.image) }))
    : [];

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'RESET' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: action.payload.id,
            name: action.payload.name,
            price: action.payload.price,
            image: normalizeImageUrl(action.payload.image),
            quantity: 1,
            source: action.payload.source || (action.payload.shopeeUrl ? 'Shopee' : 'Interno'),
            shopeeUrl: action.payload.shopeeUrl || '',
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    case 'UPDATE_QUANTITY': {
      const quantity = Math.min(Math.max(1, action.payload.quantity), MAX_QUANTITY);
      return {
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity } : item
        ),
      };
    }
    case 'RESET':
      return { items: [] };
    default:
      return state;
  }
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  resetCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, (): CartState => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return { items: normalizeStoredItems(saved ? JSON.parse(saved) : []) };
    } catch {
      return { items: [] };
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // O carrinho continua funcionando quando o armazenamento está indisponível.
    }
  }, [state.items]);

  const addToCart = useCallback((product: Product) => dispatch({ type: 'ADD_ITEM', payload: product }), []);
  const removeFromCart = useCallback((id: number) => dispatch({ type: 'REMOVE_ITEM', payload: { id } }), []);
  const updateQuantity = useCallback(
    (id: number, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
    []
  );
  const resetCart = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: state.items,
      subtotal,
      tax,
      total,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      resetCart,
    };
  }, [state.items, addToCart, removeFromCart, updateQuantity, resetCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
