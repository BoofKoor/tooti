'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'confirm' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Literal class maps (not template strings) so Tailwind keeps the @layer
// components rules during tree-shaking.
const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  confirm: 'btn--confirm',
  secondary: 'btn--secondary',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the 3-dot loader, preserve width, and block interaction. */
  loading?: boolean;
  /** Render the label in the Persian (Vazirmatn) face for fa islands. */
  fa?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fa = false,
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        variantClass[variant],
        sizeClass[size],
        loading && 'btn--loading',
        fa && 'fa',
        className,
      )}
      // A4: while loading, stay focusable (don't drop out of the tab order) and
      // keep an accessible name — use aria-disabled, not the native `disabled`,
      // and block activation. aria-busy announces the pending state; the label
      // remains in the a11y tree (CSS hides it with opacity, not visibility).
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      dir={fa ? 'rtl' : undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      onKeyDown={
        loading
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
            }
          : onKeyDown
      }
      {...props}
    >
      <span className="btn__label">{children}</span>
      {loading ? (
        <span className="btn__dots" aria-hidden="true">
          <span className="btn__dot" />
          <span className="btn__dot" />
          <span className="btn__dot" />
        </span>
      ) : null}
    </button>
  );
}
