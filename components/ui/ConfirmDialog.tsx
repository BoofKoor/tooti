'use client';

import { useEffect } from 'react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` tints the confirm action red (e.g. leaving = losing progress). */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight confirm modal used to guard destructive navigation (e.g. quitting
 * a lesson mid-flow, which discards progress). Escape and a scrim click cancel;
 * the cancel button is focused on open so the safe choice is the default. The
 * app has no general modal primitive yet, so this stays purpose-built and small.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Leave',
  cancelLabel = 'Keep going',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-scrim" role="presentation" onClick={onCancel}>
      <div
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={body ? 'confirm-body' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="confirm-title">
          {title}
        </h2>
        {body ? (
          <p id="confirm-body" className="confirm-body">
            {body}
          </p>
        ) : null}
        <div className="confirm-actions">
          <Button variant="secondary" size="md" className="flex-1" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'primary' : 'confirm'}
            size="md"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
