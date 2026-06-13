import type { ReactNode } from 'react';

/**
 * A template re-mounts on every navigation (unlike a layout), so its mount
 * animation gives a gentle cross-route fade-up. CSS-only and reduced-motion
 * aware (see .route-fade in styles/globals.css).
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
