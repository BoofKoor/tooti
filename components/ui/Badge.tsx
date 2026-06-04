import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'streak' | 'xp' | 'unit';
export type BadgeSize = 'sm' | 'md' | 'lg';

// Literal class maps so Tailwind keeps the @layer components rules.
const variantClass: Record<BadgeVariant, string> = {
  streak: 'badge--streak',
  xp: 'badge--xp',
  unit: 'badge--unit',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'badge--sm',
  md: 'badge--md',
  lg: 'badge--lg',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  /** Numeric value, rendered with tabular figures. */
  value?: ReactNode;
  label?: string;
  /** Render text in the Persian (Vazirmatn) face for fa islands. */
  fa?: boolean;
}

export function Badge({
  variant,
  size = 'md',
  icon,
  value,
  label,
  fa = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn('badge', variantClass[variant], sizeClass[size], fa && 'fa', className)}
      dir={fa ? 'rtl' : undefined}
      {...props}
    >
      {icon != null ? (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {value != null ? <span className="badge__num">{value}</span> : null}
      {label ? <span className="badge__label">{label}</span> : null}
    </span>
  );
}
