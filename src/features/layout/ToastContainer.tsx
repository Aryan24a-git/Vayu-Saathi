'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <aside
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 left-4 sm:left-auto z-[70] flex flex-col gap-2 pointer-events-none max-w-sm ml-auto"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium text-white transition-all ${
              t.type === 'success'
                ? 'bg-emerald-900 border-emerald-700'
                : t.type === 'warning'
                  ? 'bg-amber-900 border-amber-700'
                  : t.type === 'error'
                    ? 'bg-rose-900 border-rose-700'
                    : 'bg-slate-900 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
              {t.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              {t.type === 'error' && <XCircle className="w-4 h-4 text-rose-300 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-sky-300 shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-white/70 hover:text-white p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}
