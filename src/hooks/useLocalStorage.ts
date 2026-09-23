import { useCallback, useEffect, useRef, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const fallbackRef = useRef(initialValue);

  useEffect(() => {
    fallbackRef.current = initialValue;
  }, [initialValue]);

  const readValue = useCallback((): T => {
    if (!isBrowser) return fallbackRef.current;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallbackRef.current;
    } catch (error) {
      console.warn(`useLocalStorage: failed reading key "${key}"`, error);
      return fallbackRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        if (isBrowser) {
          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch (error) {
            console.warn(`useLocalStorage: failed setting key "${key}"`, error);
          }
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue] as const;
};
