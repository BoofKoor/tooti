'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'reward' | 'error' | 'info';

// Literal class map so Tailwind keeps the @layer components rules.
const typeClass: Record<ToastType, string> = {
  success: 'toast--success',
  reward: 'toast--reward',
  error: 'toast--error',
  info: 'toast--info',
};

export interface ToastProps {
  type: ToastType;
  title: string;
  sub?: string;
  /** The app supplies the icon (a ~22px svg using currentColor). */
  icon: ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Presentational toast. The queue / provider / auto-dismiss manager arrives when
 * screens are wired; entrance/exit are exposed as the `toast-drop` / `toast-leave`
 * animation classes for that layer to apply.
 */
export function Toast({ type, title, sub, icon, onClose, className }: ToastProps) {
  // Each toast is its own live region (the stack is NOT, to avoid nesting):
  // errors interrupt as an assertive alert, everything else is announced politely.
  const role = type === 'error' ? 'alert' : 'status';
  return (
    <div className={cn('toast', typeClass[type], className)} role={role}>
      <span className="toast__chip" aria-hidden="true">
        {icon}
      </span>
      <div className="toast__body">
        <div className="toast__title">{title}</div>
        {sub ? <div className="toast__sub">{sub}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="toast__close" onClick={onClose} aria-label="Dismiss">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
