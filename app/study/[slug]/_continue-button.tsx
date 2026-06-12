'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Lightning } from '@phosphor-icons/react/dist/ssr';
import { Button, useToast } from '@/components/ui';
import { completeLearnStage } from '@/app/actions/gamification';

/**
 * Learn-stage completion island. First read awards the flat Learn-stage XP
 * (toasting any medals/milestones — toasts outlive the navigation because the
 * ToastProvider sits in the root layout); replays just navigate back.
 */
export function ContinueButton({ slug, completed }: { slug: string; completed: boolean }) {
  const router = useRouter();
  const push = useToast();
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    setBusy(true);
    // IANA tz from the browser; the action falls back to Asia/Tehran.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await completeLearnStage({ slug, timezone: tz });
    if (res.xpEarned > 0) {
      push({ type: 'reward', title: `+${res.xpEarned} XP`, icon: <Lightning weight="fill" /> });
    }
    res.newMedals.forEach((m) =>
      push({
        type: 'reward',
        title: 'Medal unlocked!',
        sub: m.name,
        icon: <Lightning weight="fill" />,
      }),
    );
    if (res.streakMilestone) {
      push({
        type: 'info',
        title: `${res.streakMilestone}-day streak!`,
        icon: <Flame weight="fill" />,
      });
    }
    router.push('/learn');
  }

  if (completed) {
    return (
      <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/learn')}>
        Back to Learn
      </Button>
    );
  }
  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      loading={busy}
      onClick={() => void onContinue()}
    >
      I&rsquo;ve read this — continue
    </Button>
  );
}
