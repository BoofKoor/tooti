'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { LessonKind } from '@prisma/client';
import {
  Check,
  Flame,
  Lightning,
  SpeakerHigh,
  SpeakerLow,
  Warning,
  X,
} from '@phosphor-icons/react/dist/ssr';
import { Button, ConfirmDialog, Mascot, Text, useToast } from '@/components/ui';
import { completeLesson, type CompleteResult } from '@/app/actions/gamification';
import { TOTAL_HEARTS, answerMatches, shuffledOrder } from '@/lib/gamification';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useSpeech } from '@/lib/use-speech';
import { fa } from '@/lib/i18n/fa';
import { cn } from '@/lib/utils';
import { optionCount, type Question } from './_questions';

// Brand palette the confetti burst cycles through (existing color tokens).
const CONFETTI_COLORS = [
  'var(--color-primary)',
  'var(--color-xp)',
  'var(--color-correct)',
  'var(--color-purple)',
  'var(--color-pink)',
  'var(--color-teal)',
];
const CONFETTI_COUNT = 16;

/** Counts a number up from 0 to `target` (~ms, easeOutCubic); skipped under reduced motion. */
function useCountUp(target: number, ms = 700): number {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target)); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);
  return n;
}

/** Animated count-up of a number (the XP stat on the complete screen). */
function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

type ConfettiPiece = { x: string; d: string; c: string };

/** One-shot CSS confetti burst behind the mascot; renders nothing under reduced motion. */
function Confetti() {
  const reduce = useReducedMotion();
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        x: `${Math.round((i / CONFETTI_COUNT) * 100 + (Math.random() * 6 - 3))}%`,
        d: `${(1.4 + Math.random() * 1.1).toFixed(2)}s`,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  if (reduce) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{ '--x': p.x, '--d': p.d, '--c': p.c } as CSSProperties}
        />
      ))}
    </div>
  );
}

/*
 * Lesson / exercise runner — client island, fed real questions by the server
 * wrapper (page.tsx). Full-screen (outside the (app) tab shell). Runner/exercise
 * styling is the verbatim CSS in globals.css (@layer components). In dir="ltr"
 * the styleguide flips the instruct slots so English is primary and Persian
 * secondary. Renders by Question type: MCQ tiles, FILL_BLANK typed input, and
 * the WORD_BANK/TRANSLATE tile builder, and LISTEN (browser-TTS audio + the same
 * tile builder, sentence hidden until answered) — hearts/XP/feedback are
 * type-agnostic (one correct-or-wrong per exercise).
 */

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

export function LessonRunner({
  slug,
  kind,
  title,
  questions,
  initialOrder,
}: {
  slug: string;
  kind: LessonKind;
  title: string;
  questions: Question[];
  /** Display→original tile order for question 1 (server-shuffled per request); null = no tiles. */
  initialOrder: number[] | null;
}) {
  const router = useRouter();
  const push = useToast();
  const [index, setIndex] = useState(0);
  // Options/banks are authored correct-first, so each question gets a fresh
  // shuffled display order; `selected`/`built` store DISPLAY/original indices
  // and `order` maps between them.
  const [order, setOrder] = useState<number[]>(initialOrder ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(TOTAL_HEARTS);
  const [lostHeart, setLostHeart] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [done, setDone] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const q = questions[index];

  // Browser TTS for LISTEN items. Auto-play the sentence once when a listening
  // question first appears (and once more if voices resolve a beat late) — the
  // ref guards against re-speaking on every unrelated re-render.
  const { status: speechStatus, speaking, speak } = useSpeech();
  const autoplayedRef = useRef<number | null>(null);
  useEffect(() => {
    if (q.type === 'LISTEN' && speechStatus === 'ready' && autoplayedRef.current !== index) {
      autoplayedRef.current = index;
      speak(q.prompt);
    }
  }, [index, q, speechStatus, speak]);

  // The verdict banner lives in the sticky footer; on short screens it shrinks
  // the question area. Start each new question at the top of the stage, and on
  // Check scroll the correct tile into view so the answer is never below the fold.
  const stageScrollRef = useRef<HTMLDivElement | null>(null);
  const correctTileRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    stageScrollRef.current?.scrollTo({ top: 0 });
  }, [index]);
  useEffect(() => {
    if (checked) {
      correctTileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [checked]);

  const isCorrect =
    q.type === 'MCQ'
      ? selected !== null && order[selected] === q.correctIndex
      : q.type === 'FILL_BLANK'
        ? answerMatches(typed, q.answer, q.accept)
        : answerMatches(built.map((i) => q.options[i]).join(' '), q.answer);

  const canCheck =
    q.type === 'MCQ'
      ? selected !== null
      : q.type === 'FILL_BLANK'
        ? typed.trim().length > 0
        : built.length > 0;

  // Wrong-answer banner: the canonical answer (MCQ shows the correct option).
  const correctText = q.type === 'MCQ' ? q.options[q.correctIndex] : q.answer;

  function check() {
    if (!canCheck || checked) return;
    setChecked(true);
    if (isCorrect) {
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
    try {
      const res = await completeLesson({
        slug,
        correctCount,
        totalCount: questions.length,
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
      setDone(true);
    } catch {
      // Network/server hiccup: surface it and let them retry instead of leaving
      // the Continue button spinning forever.
      push({
        type: 'error',
        title: "Couldn't save your lesson",
        sub: 'Check your connection and try again.',
        icon: <Warning weight="fill" />,
      });
    } finally {
      setFinishing(false);
    }
  }

  function resetQuestionState(nextQuestion: Question) {
    setOrder(shuffledOrder(optionCount(nextQuestion)));
    setSelected(null);
    setTyped('');
    setBuilt([]);
    setChecked(false);
    setLostHeart(null);
  }

  function next() {
    if (failed) {
      setOutOfHearts(true);
      return;
    }
    if (index + 1 >= questions.length) {
      void finish();
      return;
    }
    setIndex(index + 1);
    resetQuestionState(questions[index + 1]);
  }

  function restart() {
    setIndex(0);
    resetQuestionState(questions[0]); // reshuffle — retries aren't memorizable by position
    setHearts(TOTAL_HEARTS);
    setCorrectCount(0);
    setFailed(false);
    setOutOfHearts(false);
    setFinishing(false);
    setResult(null);
    setDone(false);
    // SECTION_TEST questions are sampled server-side per request, so a retry
    // refetches the page data for a fresh 10-question draw from the pool.
    router.refresh();
  }

  // Literal class strings so Tailwind keeps the @layer components state rules.
  function tileClass(display: number): string {
    if (q.type !== 'MCQ') return '';
    if (!checked) return display === selected ? 'is-selected' : '';
    if (order[display] === q.correctIndex) return 'is-correct';
    if (display === selected) return 'is-incorrect';
    return '';
  }

  function addToBuilt(orig: number) {
    setBuilt((b) => (b.includes(orig) ? b : [...b, orig]));
  }

  function removeFromBuilt(position: number) {
    setBuilt((b) => b.filter((_, j) => j !== position));
  }

  // Shared sentence builder (word-bank + translate + listen): the built row and
  // the remaining bank, mapping display order → original token index.
  function builderTiles(options: string[]) {
    const bank = order.filter((orig) => !built.includes(orig));
    return (
      <>
        <div className="wb-built" aria-label="Your sentence">
          {built.map((orig, position) => (
            <button
              key={`${orig}-${position}`}
              type="button"
              className="wb-tile"
              disabled={checked}
              onClick={() => removeFromBuilt(position)}
            >
              {options[orig]}
            </button>
          ))}
        </div>
        <div className="wb-bank" aria-label="Word bank">
          {bank.map((orig) => (
            <button
              key={orig}
              type="button"
              className="wb-tile"
              disabled={checked}
              onClick={() => addToBuilt(orig)}
            >
              {options[orig]}
            </button>
          ))}
        </div>
      </>
    );
  }

  function questionBody(question: Question) {
    switch (question.type) {
      case 'MCQ':
        return (
          <>
            <div className="ex-prompt">{question.prompt}</div>
            <div className="mcq-grid">
              {order.map((orig, display) => (
                <button
                  key={display}
                  ref={orig === question.correctIndex ? correctTileRef : undefined}
                  type="button"
                  className={cn('mcq-tile', tileClass(display))}
                  disabled={checked}
                  aria-pressed={selected === display}
                  onClick={() => setSelected(display)}
                >
                  <span className="mcq-num">{display + 1}</span>
                  <span className="mcq-state-ic" aria-hidden="true" />
                  <span className="mcq-label-en">{question.options[orig]}</span>
                </button>
              ))}
            </div>
          </>
        );
      case 'FILL_BLANK':
        return (
          <>
            <div className="ex-prompt">{question.prompt}</div>
            <input
              type="text"
              className={cn('fb-input', checked && (isCorrect ? 'is-correct' : 'is-incorrect'))}
              value={typed}
              placeholder="Type your answer"
              aria-label="Your answer"
              disabled={checked}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') check();
              }}
            />
          </>
        );
      case 'WORD_BANK':
      case 'TRANSLATE':
        return (
          <>
            {question.type === 'TRANSLATE' ? (
              <div className="ex-target fa" dir="rtl">
                {question.prompt}
              </div>
            ) : question.prompt ? (
              <div className="ex-prompt">{question.prompt}</div>
            ) : null}
            {builderTiles(question.options)}
          </>
        );
      case 'LISTEN':
        return (
          <>
            <div className="listen-stage">
              <button
                type="button"
                className={cn('listen-play', speaking && 'is-speaking')}
                disabled={speechStatus === 'pending'}
                aria-label="Play the sentence"
                onClick={() => speak(question.prompt)}
              >
                <SpeakerHigh weight="fill" />
              </button>
              {speechStatus === 'ready' ? (
                <button
                  type="button"
                  className="listen-slow"
                  aria-label="Play slowly"
                  onClick={() => speak(question.prompt, { slow: true })}
                >
                  <SpeakerLow weight="fill" />
                  <span>Slow</span>
                </button>
              ) : null}
              {/* No speech voice → reveal the sentence so the item stays solvable. */}
              {speechStatus === 'unsupported' ? (
                <div className="listen-fallback">
                  <p className="listen-fallback-text en">{question.prompt}</p>
                  <p className="fa" dir="rtl">
                    {fa.listen.audioFallback}
                  </p>
                </div>
              ) : null}
            </div>
            {builderTiles(question.options)}
            {checked && speechStatus !== 'unsupported' ? (
              <div className="listen-reveal en">
                <span className="listen-reveal-label">You heard</span>
                {question.prompt}
              </div>
            ) : null}
          </>
        );
    }
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

  if (done && kind === 'SECTION_TEST' && result?.passed === false) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <Mascot pose="reassure" size={160} />
        <Text variant="section" as="h1">
          Not passed yet
        </Text>
        <Text variant="body" className="text-text-2">
          {title} · {correctCount}/{questions.length}
        </Text>
        <Text variant="body" fa className="text-text-2">
          {fa.lesson.testBar}
        </Text>
        <Button variant="primary" size="lg" className="w-full max-w-xs" onClick={restart}>
          Try again
        </Button>
        <Button
          variant="secondary"
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
    const streak = result?.streak ?? 0;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="flex min-h-dvh flex-col justify-center p-4" dir="ltr">
        <div className="lesson-complete" data-confetti-host>
          <Confetti />
          <div className="lc-mascot">
            <Mascot pose="celebrate" />
          </div>
          <h2 className="en">Lesson complete!</h2>
          <p className="lc-sub">
            {correctCount} of {questions.length} questions · one step closer today
          </p>
          <div className="lc-stats">
            <div className="lc-stat">
              <div className="ic ic-xp">
                <Lightning weight="fill" />
              </div>
              <div className="v num">
                <CountUp value={earnedXp} />
              </div>
              <div className="k">XP earned</div>
            </div>
            <div className="lc-stat">
              <div className="ic ic-streak">
                <Flame weight="fill" />
              </div>
              <div className="v num">{streak}</div>
              <div className="k">day streak</div>
            </div>
            <div className="lc-stat">
              <div className="ic ic-acc">
                <Check weight="bold" />
              </div>
              <div className="v num">{accuracy}%</div>
              <div className="k">accuracy</div>
            </div>
          </div>
          <div className="lc-actions">
            <Button variant="confirm" size="lg" onClick={() => router.push('/learn')}>
              Continue
            </Button>
            <Button variant="secondary" size="lg" onClick={restart}>
              Review questions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = ((index + (checked ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="scr-lesson h-dvh" dir="ltr">
      <div className="lesson-bar">
        <button
          type="button"
          className="close"
          aria-label="Close lesson"
          onClick={() =>
            index > 0 || checked || correctCount > 0 ? setConfirmExit(true) : router.push('/learn')
          }
        >
          <X weight="bold" />
        </button>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="lb-stats">
          <div className="hearts">
            {Array.from({ length: TOTAL_HEARTS }).map((_, i) => (
              <Heart key={i} filled={i < hearts} losing={i === lostHeart} />
            ))}
          </div>
        </div>
      </div>

      <div ref={stageScrollRef} className="flex-1 overflow-y-auto p-4">
        <article className="ex-stage" dir="ltr">
          <div className="ex-header">
            <div className="ex-mascot">
              <Mascot pose="encourage" />
            </div>
            <div className="ex-instruct">
              <div className="ex-instruct-fa">{q.instructionEn}</div>
            </div>
          </div>

          {questionBody(q)}
        </article>
      </div>

      <div className="lesson-foot shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {!checked ? (
          <Button
            variant="confirm"
            size="lg"
            className="w-full"
            disabled={!canCheck}
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
              {isCorrect ? (
                <div className="fb-meta">
                  <span className="fb-xp">
                    <Lightning weight="fill" /> +10 XP
                  </span>
                </div>
              ) : (
                <>
                  <div className="fb-correct-line">
                    Correct:{' '}
                    <bdi>
                      <b>{correctText}</b>
                    </bdi>
                  </div>
                  {q.explanationEn ? <div className="fb-explain">{q.explanationEn}</div> : null}
                </>
              )}
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

      <ConfirmDialog
        open={confirmExit}
        title="Leave the lesson?"
        body="Your progress on this lesson won't be saved."
        confirmLabel="Leave"
        cancelLabel="Keep going"
        onConfirm={() => router.push('/learn')}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}
