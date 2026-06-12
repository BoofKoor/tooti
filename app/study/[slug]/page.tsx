import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { shuffledOrder } from '@/lib/gamification';
import type { SectionContent } from '@/lib/lesson-content';
import { getLearnPath, getLessonWithExercises } from '@/lib/learn-data';
import { StudyReader, type ReaderSection } from './_reader';

/*
 * Learn-stage page (Phase 5B) — server wrapper for the sectioned reader. Keeps
 * the Phase 5A guards (unknown slug 404s, non-LESSON kinds go to the runner,
 * locked stages bounce back to the path) and hands the typed sections to the
 * client reader.
 */

export default async function StudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth(); // the study layout already guards; we need the id
  if (!session?.user?.id) redirect('/login');

  const lesson = await getLessonWithExercises(slug);
  if (!lesson) notFound();
  if (lesson.kind !== 'LESSON') redirect(`/lesson/${slug}`);

  // Sequential unlock — locked stages bounce back to the path.
  const path = await getLearnPath(session.user.id);
  const node = path.flatMap((u) => u.lessons).find((l) => l.slug === slug);
  if (!node?.unlocked) redirect('/learn');

  // VIDEO sections without a url are dropped here so the client never sees them.
  const sections: ReaderSection[] = lesson.sections
    .map((s) => ({
      kind: s.kind,
      titleEn: s.titleEn,
      titleFa: s.titleFa,
      content: s.content as unknown as SectionContent,
    }))
    .filter((s) => s.kind !== 'VIDEO' || !!s.content.url);

  // Pre-shuffled option order for the first section's micro-check, computed per
  // request so the server-rendered HTML is already shuffled (and hydration
  // matches). Later sections shuffle client-side on entry.
  const firstCheck = sections[0]?.content.check ?? null;
  const firstCheckOrder = firstCheck ? shuffledOrder(firstCheck.options.length) : null;

  return (
    <StudyReader
      slug={slug}
      unitTitle={lesson.unit.title}
      completed={node.completed}
      sections={sections}
      firstCheckOrder={firstCheckOrder}
    />
  );
}
