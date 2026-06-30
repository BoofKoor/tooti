'use client';

import { useState, useTransition } from 'react';
import { Target, Warning } from '@phosphor-icons/react/dist/ssr';
import { useToast } from '@/components/ui';
import { setDailyGoal } from '@/app/actions/gamification';
import { DAILY_GOAL_OPTIONS } from '@/lib/gamification';
import { cn } from '@/lib/utils';

/**
 * Segmented daily-goal picker (10/20/30/50). Optimistically highlights the
 * choice, then persists via the setDailyGoal server action (which revalidates
 * /profile so the goal bar + this-week recompute).
 */
export function DailyGoalPicker({ current }: { current: number }) {
  const push = useToast();
  const [goal, setGoal] = useState(current);
  const [pending, startTransition] = useTransition();

  function pick(n: number) {
    if (n === goal || pending) return;
    const prev = goal;
    setGoal(n); // optimistic
    startTransition(async () => {
      try {
        await setDailyGoal(n);
        push({
          type: 'success',
          title: 'Daily goal updated',
          sub: `${n} XP a day`,
          icon: <Target weight="fill" />,
        });
      } catch {
        setGoal(prev); // roll back the optimistic highlight
        push({
          type: 'error',
          title: "Couldn't update your goal",
          sub: 'Please try again.',
          icon: <Warning weight="fill" />,
        });
      }
    });
  }

  return (
    <div className="goal-picker" role="group" aria-label="Daily goal">
      {DAILY_GOAL_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          className={cn('goal-pill', n === goal && 'is-active')}
          aria-pressed={n === goal}
          disabled={pending}
          onClick={() => pick(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
