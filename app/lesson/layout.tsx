import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * The lesson runner lives outside the (app) tab shell (no tab bar) but is still
 * authenticated content. This layout guards it server-side — the source of truth
 * for route protection — without adding the tab bar.
 */
export default async function LessonLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <>{children}</>;
}
