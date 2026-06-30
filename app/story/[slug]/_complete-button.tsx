'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Lightning, Warning } from '@phosphor-icons/react/dist/ssr';
import { Button, useToast } from '@/components/ui';
import { completeStory } from '@/app/actions/gamification';

/**
 * Story completion island. First play awards the flat Story XP (toasting any
 * medals/milestones — toasts outlive the navigation because the ToastProvider
 * sits in the root layout); replays just navigate back.
 */
export function StoryCompleteButton({ slug, completed }: { slug: string; completed: boolean }) {
  const router = useRouter();
  const push = useToast();
  const [busy, setBusy] = useState(false);

  async function onFinish() {
    setBusy(true);
    // IANA tz from the browser; the action falls back to Asia/Tehran.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await completeStory({ slug, timezone: tz });
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
    } catch {
      // Network/server hiccup: don't strand the user on a spinning button.
      setBusy(false);
      push({
        type: 'error',
        title: "Couldn't save your progress",
        sub: 'Check your connection and try again.',
        icon: <Warning weight="fill" />,
      });
    }
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
      variant="confirm"
      size="lg"
      className="w-full"
      loading={busy}
      onClick={() => void onFinish()}
    >
      Finish story
    </Button>
  );
}
