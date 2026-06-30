'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StateTone = 'empty' | 'error';

export interface StateAction {
  label: string;
  onClick?: () => void;
}

const toneClass: Record<StateTone, string> = {
  empty: 'es--empty',
  error: 'es--error',
};

export interface StateViewProps {
  tone: StateTone;
  /** Illustration node (the Mascot fills this in Batch C). */
  illustration?: ReactNode;
  title: string;
  description?: string;
  /** A <Button> node; the caller wires its own onClick. */
  primaryAction?: ReactNode;
  secondaryAction?: StateAction;
  /** Tiny corner eyebrow. */
  tag?: string;
  className?: string;
}

export function StateView({
  tone,
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  tag,
  className,
}: StateViewProps) {
  return (
    // A3: an error state that swaps in dynamically must announce itself — role
    // "alert" carries an implicit assertive live region. Empty states are not
    // urgent, so they stay silent.
    <div
      className={cn('es', toneClass[tone], className)}
      role={tone === 'error' ? 'alert' : undefined}
    >
      {tag ? <span className="es-tag">{tag}</span> : null}
      {illustration ? <div className="es-art">{illustration}</div> : null}
      <h2 className="es-title">{title}</h2>
      {description ? <p className="es-sub">{description}</p> : null}
      {primaryAction || secondaryAction ? (
        <div className="es-actions">
          {primaryAction}
          {secondaryAction ? (
            <button type="button" className="es-action-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState(props: Omit<StateViewProps, 'tone'>) {
  return <StateView tone="empty" {...props} />;
}

export function ErrorState(props: Omit<StateViewProps, 'tone'>) {
  return <StateView tone="error" {...props} />;
}
