'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast, type ToastType } from './Toast';

type ToastInput = { type: ToastType; title: string; sub?: string; icon: ReactNode };
type Queued = ToastInput & { id: number };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

/**
 * App-wide toast queue. Mounted once in the root layout so toasts work
 * everywhere — including the full-screen lesson runner outside the (app) shell.
 * Presentation stays in Toast; this adds the stack + auto-dismiss. Motion polish
 * (spring/drop) is Phase 6.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Queued[]>([]);
  const dismiss = (id: number) => setItems((s) => s.filter((x) => x.id !== id));
  const push = useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => dismiss(id), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            title={t.title}
            sub={t.sub}
            icon={t.icon}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
