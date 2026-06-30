'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Toast, type ToastType } from './Toast';

type ToastInput = { type: ToastType; title: string; sub?: string; icon: ReactNode };
type Queued = ToastInput & { id: number };

const DISMISS_MS = 3200;

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

/**
 * App-wide toast queue. Mounted once in the root layout so toasts work
 * everywhere — including the full-screen lesson runner outside the (app) shell.
 * Presentation stays in Toast; this adds the stack + auto-dismiss.
 *
 * Auto-dismiss pauses while the user hovers or keyboard-focuses the stack so the
 * timer can't yank a toast away mid-read or mid-interaction (WCAG 2.2.1). The
 * stack is NOT a live region — each Toast announces itself via its own role
 * (status / assertive alert), which avoids the duplicate-announcement that a
 * nested aria-live container would cause.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Queued[]>([]);
  // id -> remaining ms + the timer handle and the wall-clock it was last armed at.
  const timers = useRef<
    Map<number, { timeout: ReturnType<typeof setTimeout>; remaining: number; start: number }>
  >(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t.timeout);
      timers.current.delete(id);
    }
    setItems((s) => s.filter((x) => x.id !== id));
  }, []);

  const arm = useCallback(
    (id: number, ms: number) => {
      const timeout = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, { timeout, remaining: ms, start: Date.now() });
    },
    [dismiss],
  );

  const push = useCallback(
    (t: ToastInput) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { ...t, id }]);
      arm(id, DISMISS_MS);
    },
    [arm],
  );

  const pauseAll = useCallback(() => {
    const now = Date.now();
    timers.current.forEach((t) => {
      clearTimeout(t.timeout);
      t.remaining = Math.max(0, t.remaining - (now - t.start));
    });
  }, []);

  const resumeAll = useCallback(() => {
    Array.from(timers.current.entries()).forEach(([id, t]) => arm(id, t.remaining));
  }, [arm]);

  // Clear every pending timer if the provider unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t.timeout));
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="toast-stack"
        onMouseEnter={pauseAll}
        onMouseLeave={resumeAll}
        onFocus={pauseAll}
        onBlur={resumeAll}
      >
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
