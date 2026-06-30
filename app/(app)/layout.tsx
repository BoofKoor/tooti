import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppTabBar } from './_app-tabbar';

/**
 * Mobile-first app shell: a fixed-height column (centered on larger screens so it
 * reads as a phone) with a scrollable content region, and the TabBar
 * (Learn · Vocab · Profile) floated over the bottom. Each screen's scroll region
 * carries --tabbar-inset bottom padding so nothing hides behind the frosted bar.
 * Welcome ('/') and the full-screen lesson / story / study routes live outside
 * this shell (no tab bar).
 *
 * This layout also guards the whole (app) route group: an unauthenticated visitor
 * is redirected to /login. The server-side check here is the source of truth for
 * route protection (no DB session lookup in edge middleware).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-app flex-col bg-bg">
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      {/* Docked to the VISUAL viewport bottom with position:fixed (not absolute
          inside the h-dvh shell): in an in-app browser 100dvh can exceed the
          visible area, the body then scrolls, and an in-flow absolute bar rides
          up with it. Fixed pins the bar to the viewport — immune to body scroll
          and to dynamic-toolbar jank — while mx-auto/max-w-app keeps it inside the
          centered phone column. .app-tabbar-dock carries the z-index (fixed makes
          its own stacking context, so it must out-rank the path node rings).
          Click-through except the bar itself; content scrolls under the frost. */}
      <nav
        aria-label="Primary"
        className="app-tabbar-dock pointer-events-none fixed inset-x-0 bottom-0 mx-auto max-w-app px-4 pb-[env(safe-area-inset-bottom)]"
      >
        <AppTabBar />
      </nav>
    </div>
  );
}
