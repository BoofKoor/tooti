'use client';

import { useState, useTransition } from 'react';
import { setDailyGoal } from '@/app/actions/gamification';
import { DAILY_GOAL_OPTIONS } from '@/lib/gamification';
import { cn } from '@/lib/utils';

/**
 * Segmented daily-goal picker (10/20/30/50). Optimistically highlights the
 * choice, then persists via the setDailyGoal server action (which revalidates
 * /profile so the goal bar + this-week recompute).
 */
export function DailyGoalPicker({ current }: { current: number }) {
  const [goal, setGoal] = useState(current);
  const [pending, startTransition] = useTransition();

  function pick(n: number) {
    if (n === goal || pending) return;
    setGoal(n);
    startTransition(async () => {
      await setDailyGoal(n);
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
