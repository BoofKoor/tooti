import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getLearnPath, getLessonWithExercises } from '@/lib/learn-data';
import { LessonRunner, type Question } from './_runner';

/*
 * Lesson runner — server wrapper (Phase 5A). Loads the real exercises, enforces
 * routing rules (Learn stages live under /study, locked lessons bounce back to
 * the path) and hands a plain Question[] to the client runner. MCQ-only this
 * batch (5C adds the other ExerciseTypes).
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

  const questions: Question[] = lesson.exercises
    .filter((e) => e.type === 'MCQ' && e.correctIndex !== null)
    .map((e) => ({
      instructionEn: e.instructionEn,
      instructionFa: e.instructionFa,
      prompt: e.prompt,
      options: e.options,
      correctIndex: e.correctIndex ?? 0,
      explanationFa: e.explanationFa,
    }));
  if (questions.length === 0) redirect('/learn');

  return <LessonRunner slug={slug} kind={lesson.kind} title={lesson.title} questions={questions} />;
}
