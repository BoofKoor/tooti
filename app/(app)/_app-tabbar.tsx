'use client';

import { usePathname, useRouter } from 'next/navigation';
import { TabBar, defaultTabs } from '@/components/ui';

/** Wires the design-system TabBar to the App Router (active tab from the URL). */
export function AppTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeId =
    defaultTabs.find((tab) => pathname.startsWith(`/${tab.id}`))?.id ?? defaultTabs[0].id;

  return <TabBar activeId={activeId} onTabChange={(id) => router.push(`/${id}`)} />;
}
