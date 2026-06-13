'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Export, GearSix, SignOut } from '@phosphor-icons/react/dist/ssr';
import { useToast } from '@/components/ui';
import { signOutAction } from '@/app/actions/auth';

/*
 * Profile topbar actions — Settings menu + Share. Replaces the two inert
 * buttons. Renders two flex children so the topbar's space-between still pushes
 * Settings to the start and Share to the end. The settings menu is a small
 * popover that closes on outside-click / Escape; Sign out posts a server action
 * (works with database sessions, no client SessionProvider needed).
 */
export function ProfileActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const push = useToast();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      push({ type: 'info', title: 'Link copied', icon: <Check weight="bold" /> });
    } catch {
      /* clipboard unavailable — nothing more we can do */
    }
  }

  async function onShare() {
    const url = location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tooti', text: 'Learn English with Tooti', url });
      } catch (err) {
        // The user dismissing the native sheet throws AbortError — ignore it.
        if ((err as Error)?.name !== 'AbortError') await copyLink(url);
      }
    } else {
      await copyLink(url);
    }
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          className="prof-icon-btn"
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <GearSix />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute top-full z-10 mt-2 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-3 start-0"
          >
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm font-bold text-text-1 transition-colors hover:bg-surface-2"
              >
                <SignOut weight="bold" /> Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <button type="button" className="prof-icon-btn" aria-label="Share" onClick={onShare}>
        <Export />
      </button>
    </>
  );
}
