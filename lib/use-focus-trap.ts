'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Modal focus management for a dialog/sheet (a11y Phase 4 — A1):
 *  - moves focus to the first focusable element inside `ref` when `active` flips on
 *    (callers should NOT also set autoFocus, or the restore target is captured wrong),
 *  - traps Tab / Shift+Tab so focus can't escape behind the scrim,
 *  - restores focus to whatever was focused before opening (the trigger) on close.
 *
 * Intentionally small: the app has no full modal primitive, so the two
 * purpose-built dialogs (ConfirmDialog, the profile sheet) share this hook.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    // Captured before we move focus in — this is the trigger to restore to on close.
    const opener = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );

    focusables()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || !node?.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !node?.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [ref, active]);
}
