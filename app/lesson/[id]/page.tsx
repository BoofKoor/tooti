import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TEST_SAMPLE_SIZE, shuffledOrder } from '@/lib/gamification';
import { getLearnPath, getLessonWithExercises } from '@/lib/learn-data';
import { optionCount, type Question } from './_questions';
import { LessonRunner } from './_runner';

/*
 * Lesson runner — server wrapper. Loads the real exercises, enforces routing
 * rules (Learn stages live under /study, locked lessons bounce back to the
 * path) and hands a plain Question[] to the client runner. All four authored
 * ExerciseTypes map to the discriminated union below; malformed rows are
 * skipped. SECTION_TEST lessons sample TEST_SAMPLE_SIZE questions from the
 * pool per request, so retries aren't memorizable.
 */

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const session = await auth(); // the lesson layout already guards; we need the id
  if (!session?.user?.id) redirect('/login');

  const lesson = await getLessonWithExercises(slug);
  if (!lesson) notFound();
  if (lesson.kind === 'LESSON') redirect(`/study/${slug}`);

  // Sequential unlock — locked lessons are not playable.
  const path = await getLearnPath(session.user.id);
  const node = path.flatMap((u) => u.lessons).find((l) => l.slug === slug);
  if (!node?.unlocked) redirect('/learn');

  const pool: Question[] = [];
  for (const e of lesson.exercises) {
    const base = {
      instructionEn: e.instructionEn,
      instructionFa: e.instructionFa,
      prompt: e.prompt,
      explanationFa: e.explanationFa,
      explanationEn: e.explanationEn,
    };
    if (e.type === 'MCQ' && e.correctIndex !== null) {
      pool.push({ type: 'MCQ', ...base, options: e.options, correctIndex: e.correctIndex });
    } else if (e.type === 'FILL_BLANK' && e.answer) {
      const accept = (e.data as { accept?: string[] } | null)?.accept ?? [];
      pool.push({ type: 'FILL_BLANK', ...base, answer: e.answer, accept });
    } else if ((e.type === 'WORD_BANK' || e.type === 'TRANSLATE') && e.options.length && e.answer) {
      pool.push({ type: e.type, ...base, options: e.options, answer: e.answer });
    }
    // other types / malformed rows are skipped (LISTEN is a later phase)
  }

  // SECTION_TEST: sample per request from the item pool (the sampled order is
  // the display order), so every attempt sees a fresh subset. The 80% bar
  // applies to the attempt (the runner reports totalCount).
  const questions =
    lesson.kind === 'SECTION_TEST' && pool.length > TEST_SAMPLE_SIZE
      ? shuffledOrder(pool.length)
          .slice(0, TEST_SAMPLE_SIZE)
          .map((i) => pool[i])
      : pool;
  if (questions.length === 0) redirect('/learn');

  // Pre-shuffled display order for question 1 when it has option/bank tiles,
  // computed per request so the server-rendered HTML is already shuffled (and
  // hydration matches). The runner reshuffles client-side for every later
  // question / retry.
  const firstCount = optionCount(questions[0]);
  const initialOrder = firstCount > 0 ? shuffledOrder(firstCount) : null;

  return (
    <LessonRunner
      slug={slug}
      kind={lesson.kind}
      title={lesson.title}
      questions={questions}
      initialOrder={initialOrder}
    />
  );
}
