import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const config: Record<ToastType, { icon: typeof CheckCircle2; tone: string; bar: string }> = {
  success: { icon: CheckCircle2, tone: 'text-success-600', bar: 'bg-success-500' },
  error: { icon: XCircle, tone: 'text-danger-600', bar: 'bg-danger-500' },
  info: { icon: Info, tone: 'text-brand-600', bar: 'bg-brand-500' },
  warning: { icon: AlertTriangle, tone: 'text-warning-600', bar: 'bg-warning-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, message) => toast({ type: 'success', title, message }),
      error: (title, message) => toast({ type: 'error', title, message }),
      info: (title, message) => toast({ type: 'info', title, message }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2.5">
          {toasts.map((t) => {
            const c = config[t.type];
            const Icon = c.icon;
            return (
              <div
                key={t.id}
                className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-ink-200 bg-white p-4 shadow-float animate-slide-in-right dark:border-white/[0.08] dark:bg-ink-850/90 dark:shadow-dark-float dark:backdrop-blur-xl"
              >
                <span className={cn('absolute left-0 top-0 h-full w-1', c.bar)} />
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', c.tone)} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t.title}</p>
                  {t.message && <p className="text-xs text-ink-500 dark:text-ink-400">{t.message}</p>}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded-md p-1 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-ink-500 dark:hover:bg-ink-700/60 dark:hover:text-ink-200"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
