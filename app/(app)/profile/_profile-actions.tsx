'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Export, GearSix, SignOut } from '@phosphor-icons/react/dist/ssr';
import { useToast } from '@/components/ui';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { signOutAction } from '@/app/actions/auth';
import { updateName } from '@/app/actions/profile';

/*
 * Profile topbar actions — Settings (gear) opens the Edit-profile bottom sheet
 * (ported from the styleguide .prof-sheet), Share stays as-is. Renders two flex
 * children so the topbar's space-between keeps the gear at the start and Share
 * at the end. The sheet (scrim z-40 / sheet z-41) sits above the floating tab
 * bar (z-30). Name saves to User.name via a server action; Sign out lives in the
 * sheet below a divider. Username + Choose-avatar are a later batch.
 */
export function ProfileActions({ currentName }: { currentName: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const push = useToast();
  const sheetRef = useRef<HTMLDivElement>(null);

  // A1: trap Tab within the sheet and restore focus to the gear on close.
  useFocusTrap(sheetRef, sheetOpen);

  useEffect(() => {
    if (!sheetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSheetOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  function closeSheet() {
    setSheetOpen(false);
    setError(null);
  }

  async function onSave(fd: FormData) {
    const res = await updateName(fd);
    if (res.ok) {
      closeSheet();
      push({ type: 'info', title: 'Saved', icon: <Check weight="bold" /> });
    } else {
      setError(res.error ?? 'Could not save');
    }
  }

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
      <button
        type="button"
        className="prof-icon-btn"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen((o) => !o)}
      >
        <GearSix />
      </button>

      <button type="button" className="prof-icon-btn" aria-label="Share" onClick={onShare}>
        <Export />
      </button>

      {sheetOpen ? (
        <>
          <div className="prof-sheet-scrim" onClick={closeSheet} />
          <div
            ref={sheetRef}
            className="prof-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
          >
            <div className="handle" />
            <h3 className="sh-title">Edit profile</h3>
            <form action={onSave}>
              <div className="prof-form">
                <div className="prof-field">
                  <label className="lbl" htmlFor="prof-name">
                    Name
                  </label>
                  <input
                    id="prof-name"
                    className="prof-input"
                    type="text"
                    name="name"
                    defaultValue={currentName}
                    maxLength={40}
                    dir="ltr"
                  />
                  {error ? <span className="err">{error}</span> : null}
                </div>
                <div className="prof-form-actions">
                  <button type="button" className="btn btn--secondary" onClick={closeSheet}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--confirm">
                    Save
                  </button>
                </div>
              </div>
            </form>
            <div className="prof-sheet-signout">
              <form action={signOutAction}>
                <button type="submit" className="btn btn--secondary" style={{ inlineSize: '100%' }}>
                  <SignOut /> Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
