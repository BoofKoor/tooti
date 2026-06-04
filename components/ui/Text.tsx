import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TextVariant = 'display' | 'section' | 'body' | 'caption';

// Literal class maps so Tailwind keeps the @layer components type classes.
const classByVariant: Record<TextVariant, { en: string; fa: string }> = {
  display: { en: 't-display', fa: 't-display-fa' },
  section: { en: 't-section', fa: 't-section-fa' },
  body: { en: 't-body', fa: 't-body-fa' },
  caption: { en: 't-caption', fa: 't-caption-fa' },
};

const defaultTag: Record<TextVariant, ElementType> = {
  display: 'h1',
  section: 'h2',
  body: 'p',
  caption: 'p',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  /** Use the Persian face (Lalezar display / Vazirmatn body) + RTL by default. */
  fa?: boolean;
  /** Override the rendered element. */
  as?: ElementType;
  children: ReactNode;
}

export function Text({
  variant = 'body',
  fa = false,
  as,
  className,
  dir,
  children,
  ...props
}: TextProps) {
  const Component = as ?? defaultTag[variant];
  const variantClass = classByVariant[variant][fa ? 'fa' : 'en'];

  return (
    <Component
      className={cn(variantClass, className)}
      dir={dir ?? (fa ? 'rtl' : undefined)}
      {...props}
    >
      {children}
    </Component>
  );
}
