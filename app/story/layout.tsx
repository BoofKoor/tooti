import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * The Story player lives outside the (app) tab shell (no tab bar) but is still
 * authenticated content — same server-side guard as the lesson runner and the
 * Learn-stage reader.
 */
export default async function StoryLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <>{children}</>;
}
