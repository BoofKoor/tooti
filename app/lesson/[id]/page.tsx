'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Flame, Lightning, X } from '@phosphor-icons/react/dist/ssr';
import { Button, Mascot, Medal, Text, useToast } from '@/components/ui';
import type { MedalType } from '@/components/ui';
import { completeLesson, type CompleteResult } from '@/app/actions/gamification';
import { cn } from '@/lib/utils';

/*
 * Lesson / exercise runner — mock data. Full-screen (outside the (app) tab
 * shell). Runner/exercise styling is the verbatim CSS in globals.css
 * (@layer components). In dir="ltr" the styleguide flips the instruct slots so
 * English is primary and Persian secondary.
 */

type Question = {
  instructionEn: string;
  instructionFa: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationFa: string;
};

const QUESTIONS: Question[] = [
  {
    instructionEn: 'Choose the correct form.',
    instructionFa: 'شکلِ درست را انتخاب کن',
    prompt: 'She ___ coffee every morning.',
    options: ['drinks', 'drink', 'is drinking', 'drank'],
    correctIndex: 0,
    explanationFa: 'سوم‌شخصِ مفرد در حالِ ساده «s» می‌گیرد.',
  },
  {
    instructionEn: 'Pick the correct sentence.',
    instructionFa: 'جملهٔ درست را انتخاب کن',
    prompt: 'Which sentence is correct?',
    options: ['He don’t like tea.', 'He doesn’t like tea.', 'He not like tea.', 'He no like tea.'],
    correctIndex: 1,
    explanationFa: 'با سوم‌شخصِ مفرد از «doesn’t» استفاده می‌کنیم.',
  },
  {
    instructionEn: 'Complete the sentence.',
    instructionFa: 'جمله را کامل کن',
    prompt: 'They ___ in London right now.',
    options: ['live', 'lives', 'are living', 'living'],
    correctIndex: 2,
    explanationFa: 'برای کاری که همین حالا در جریان است، حالِ استمراری به‌کار می‌رود.',
  },
];

const TOTAL_HEARTS = 5;

// Heart artwork (verbatim from the styleguide hearts markup).
const HEART_PATH =
  'M13 22C13 22 2 14 2 8C2 5 4 2 7 2C9.2 2 11.5 3.5 13 5.5C14.5 3.5 16.8 2 19 2C22 2 24 5 24 8C24 14 13 22 13 22Z';

function Heart({ filled, losing }: { filled: boolean; losing: boolean }) {
  return (
    <span className={cn('heart', filled ? 'filled' : 'empty', losing && 'is-losing')}>
      <svg viewBox="0 0 26 24">
        <path className="h-fill" d={HEART_PATH} />
        <ellipse className="h-shine" cx="9" cy="6" rx="2" ry="1.3" transform="rotate(-30 9 6)" />
      </svg>
    </span>
  );
}

export default function LessonRunnerPage() {
  const router = useRouter();
  const slug = String(useParams().id);
  const push = useToast();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(TOTAL_HEARTS);
  const [lostHeart, setLostHeart] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[index];
  const isCorrect = selected === q.correctIndex;

  function check() {
    if (selected === null) return;
    setChecked(true);
    if (selected === q.correctIndex) {
      setCorrectCount((c) => c + 1);
      return;
    }
    const remaining = Math.max(0, hearts - 1);
    setHearts(remaining);
    setLostHeart(remaining);
    if (remaining === 0) setFailed(true);
  }

  async function finish() {
    setFinishing(true);
    // IANA tz from the browser; the action falls back to Asia/Tehran.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await completeLesson({
      slug,
      correctCount,
      totalCount: QUESTIONS.length,
      heartsLeft: hearts,
      timezone: tz,
    });
    setResult(res);
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
    setFinishing(false);
    setDone(true);
  }

  function next() {
    if (failed) {
      setOutOfHearts(true);
      return;
    }
    if (index + 1 >= QUESTIONS.length) {
      void finish();
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
    setLostHeart(null);
  }

  // Literal class strings so Tailwind keeps the @layer components state rules.
  function tileClass(i: number): string {
    if (!checked) return i === selected ? 'is-selected' : '';
    if (i === q.correctIndex) return 'is-correct';
    if (i === selected) return 'is-incorrect';
    return '';
  }

  if (outOfHearts) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <Mascot pose="reassure" size={160} />
        <Text variant="section" as="h1">
          Out of hearts
        </Text>
        <Text variant="body" className="text-text-2">
          Take a breather and try again.
        </Text>
        <Button
          variant="primary"
          size="lg"
          className="w-full max-w-xs"
          onClick={() => router.push('/learn')}
        >
          Back to Learn
        </Button>
      </div>
    );
  }

  if (done) {
    const earnedXp = result?.xpEarned ?? 0;
    const newMedals = result?.newMedals ?? [];
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <Mascot pose="celebrate" size={160} />
        <Text variant="section" as="h1">
          Lesson complete!
        </Text>
        <div className="inline-flex items-center gap-2 text-xp-ink">
          <Lightning weight="fill" />
          <Text variant="section" as="span" className="text-xp-ink">
            +{earnedXp} XP
          </Text>
        </div>
        {newMedals.length ? (
          <div className="flex flex-wrap items-start justify-center gap-4">
            {newMedals.map((m) => (
              <div key={m.key} className="flex w-20 flex-col items-center gap-1">
                <Medal type={m.key as MedalType} state="recently" size={64} />
                <span className="text-center text-xs font-bold text-text-2">{m.name}</span>
              </div>
            ))}
          </div>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          className="w-full max-w-xs"
          onClick={() => router.push('/learn')}
        >
          Done
        </Button>
      </div>
    );
  }

  const progressPct = ((index + (checked ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="scr-lesson h-dvh" dir="ltr">
      <div className="lesson-bar">
        <button
          type="button"
          className="close"
          aria-label="Close lesson"
          onClick={() => router.push('/learn')}
        >
          <X weight="bold" />
        </button>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label">
            {index + 1}/{QUESTIONS.length}
          </span>
        </div>
        <div className="lb-stats">
          <div className="hearts">
            {Array.from({ length: TOTAL_HEARTS }).map((_, i) => (
              <Heart key={i} filled={i < hearts} losing={i === lostHeart} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <article className="ex-stage" dir="ltr">
          <div className="ex-header">
            <div className="ex-mascot">
              <Mascot pose="encourage" />
            </div>
            <div className="ex-instruct">
              {/* dir="ltr": the -en slot is the Persian secondary, -fa the English primary. */}
              <div className="ex-instruct-en">{q.instructionFa}</div>
              <div className="ex-instruct-fa">{q.instructionEn}</div>
            </div>
          </div>

          <div className="ex-prompt">{q.prompt}</div>

          <div className="mcq-grid">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className={cn('mcq-tile', tileClass(i))}
                disabled={checked}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="mcq-num">{i + 1}</span>
                <span className="mcq-state-ic" aria-hidden="true" />
                <span className="mcq-label-en">{opt}</span>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {!checked ? (
          <Button
            variant="confirm"
            size="lg"
            className="w-full"
            disabled={selected === null}
            onClick={check}
          >
            Check
          </Button>
        ) : (
          <div className={cn('fb-banner', isCorrect ? 'fb-correct' : 'fb-incorrect')}>
            <div className="fb-mascot">
              <Mascot pose={isCorrect ? 'celebrate' : 'reassure'} />
            </div>
            <div className="fb-text">
              <div className="fb-title en">{isCorrect ? 'Nice!' : 'Not quite'}</div>
              <div className="fb-meta">
                {isCorrect ? (
                  <span className="fb-xp">
                    <Lightning weight="fill" /> +10 XP
                  </span>
                ) : (
                  <>
                    Correct: <b>{q.options[q.correctIndex]}</b> ·{' '}
                    <span className="fa" dir="rtl">
                      {q.explanationFa}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="fb-action">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={finishing}
                onClick={next}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
