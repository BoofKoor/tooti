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
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      dir={fa ? 'rtl' : undefined}
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
