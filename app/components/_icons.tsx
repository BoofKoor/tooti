import type { ReactNode } from 'react';

// Simple inline icons for the showcase only (currentColor; sized by chip CSS).
// In the real app the caller supplies the icon node per Toast.
export const icons: Record<'success' | 'reward' | 'error' | 'info', ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  reward: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.7 5.6 6.1.6-4.6 4 1.4 6L12 19.6 6.4 18.7l1.4-6-4.6-4 6.1-.6z" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1.3 15h-2.6v-6.5h2.6V17zM12 6.6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  ),
};

// Neutral placeholder illustration for the state views (Mascot lands in Batch C).
export const placeholderArt: ReactNode = (
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <rect x="22" y="24" width="76" height="76" rx="24" fill="currentColor" opacity="0.16" />
    <circle cx="60" cy="54" r="20" fill="currentColor" opacity="0.3" />
    <rect x="40" y="82" width="40" height="9" rx="4.5" fill="currentColor" opacity="0.22" />
  </svg>
);
