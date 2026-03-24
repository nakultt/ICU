import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, CircleCheckBig, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
};

type ToastInput = Omit<Toast, 'id'>;

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const styles: Record<ToastType, string> = {
  success: 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/70 dark:text-teal-100',
  error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-100',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/70 dark:text-cyan-100',
};

function icon(type: ToastType) {
  if (type === 'success') return <CircleCheckBig size={18} className="mt-0.5" />;
  if (type === 'error') return <TriangleAlert size={18} className="mt-0.5" />;
  return <BellRing size={18} className="mt-0.5" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((item) => item.id !== id));

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-lg ${styles[toast.type]}`}
            >
              <div className="flex items-start gap-3">
                {icon(toast.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{toast.title}</p>
                  {toast.message && <p className="mt-1 text-xs opacity-85">{toast.message}</p>}
                </div>
                <button type="button" onClick={() => remove(toast.id)} className="rounded-md p-1 transition hover:bg-black/5 dark:hover:bg-white/10">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
