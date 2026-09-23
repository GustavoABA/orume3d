import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type ToastVariant = 'success' | 'info';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void;
  dismissToast: (id: string) => void;
};

const DEFAULT_DURATION = 2600;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timerId = timers.current[id];
    if (timerId) {
      window.clearTimeout(timerId);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, options?: { variant?: ToastVariant; duration?: number }) => {
      const { variant = 'success', duration = DEFAULT_DURATION } = options ?? {};
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      setToasts((prev) => [...prev, { id, message, variant }]);

      timers.current[id] = window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((timerId) => window.clearTimeout(timerId));
      timers.current = {};
    },
    []
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastViewport = () => {
  const { toasts, dismissToast } = useToast();

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: -12, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-xl shadow-black/40 backdrop-blur"
            >
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-100">
                <span
                  className={`inline-flex h-2.5 w-2.5 flex-none rounded-full ${
                    toast.variant === 'success' ? 'bg-accent' : 'bg-slate-400'
                  }`}
                />
                <p className="flex-1 text-left text-sm font-medium text-slate-100">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 transition hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
                >
                  Close
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};
