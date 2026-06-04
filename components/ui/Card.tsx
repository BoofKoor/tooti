import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type CardRadius = 'lg' | 'xl' | '2xl';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShadow = 1 | 2 | 3 | 4;

// All values resolve to design tokens via Tailwind utilities (no raw values).
const radiusClass: Record<CardRadius, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

const paddingClass: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'px-8 py-6',
  lg: 'px-10 py-8',
};

const shadowClass: Record<CardShadow, string> = {
  1: 'shadow-1',
  2: 'shadow-2',
  3: 'shadow-3',
  4: 'shadow-4',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  radius?: CardRadius;
  padding?: CardPadding;
  shadow?: CardShadow;
}

export function Card({
  radius = '2xl',
  padding = 'md',
  shadow = 2,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'border border-border bg-surface',
        radiusClass[radius],
        paddingClass[padding],
        shadowClass[shadow],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
