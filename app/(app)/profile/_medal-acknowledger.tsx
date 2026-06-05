'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { acknowledgeMedals } from '@/app/actions/gamification';

/**
 * Marks freshly-earned medals as seen once the achievements row has been viewed:
 * if any medal is in the 'recently' state, fire acknowledgeMedals() on mount.
 * It does not revalidate, so the shimmer shows for this view and the medals read
 * as 'earned' on the next visit.
 */
export function MedalAcknowledger({
  hasRecently,
  children,
}: {
  hasRecently: boolean;
  children: ReactNode;
}) {
  const acked = useRef(false);
  useEffect(() => {
    if (hasRecently && !acked.current) {
      acked.current = true;
      void acknowledgeMedals();
    }
  }, [hasRecently]);
  return <>{children}</>;
}
