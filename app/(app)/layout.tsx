import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppTabBar } from './_app-tabbar';

/**
 * Mobile-first app shell: a fixed-height column (centered on larger screens so it
 * reads as a phone), a scrollable content region, and the TabBar pinned to the
 * bottom with safe-area padding. Welcome ('/') and the lesson runner live outside
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
    <div className="mx-auto flex h-dvh w-full max-w-app flex-col bg-bg">
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      <nav aria-label="Primary" className="shrink-0 px-4 pb-[env(safe-area-inset-bottom)]">
        <AppTabBar />
      </nav>
    </div>
  );
}
