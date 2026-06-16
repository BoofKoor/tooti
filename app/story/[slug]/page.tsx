import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { SectionContent } from '@/lib/lesson-content';
import { getLearnPath, getLessonWithExercises } from '@/lib/learn-data';
import { StoryPlayer } from './_story';

/*
 * Story player — server wrapper. Same guards as the runner / Learn-stage reader
 * (unknown slug 404s, non-STORY kinds bounce to their own route, locked stages
 * return to the path). The whole interactive narrative is authored on a single
 * section's `content.story` (no extra SectionKind / migration), so we just pull
 * it out and hand the typed steps to the client player.
 */
export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth(); // the story layout already guards; we need the id
  if (!session?.user?.id) redirect('/login');

  const lesson = await getLessonWithExercises(slug);
  if (!lesson) notFound();
  if (lesson.kind !== 'STORY') redirect(`/lesson/${slug}`);

  // Sequential unlock — locked stages bounce back to the path.
  const path = await getLearnPath(session.user.id);
  const node = path.flatMap((u) => u.lessons).find((l) => l.slug === slug);
  if (!node?.unlocked) redirect('/learn');

  const story = lesson.sections
    .map((s) => (s.content as unknown as SectionContent).story)
    .find((s): s is NonNullable<typeof s> => !!s && s.steps.length > 0);
  if (!story) redirect('/learn'); // malformed / empty story

  return (
    <StoryPlayer
      slug={slug}
      unitTitle={lesson.unit.title}
      completed={node.completed}
      titleEn={story.titleEn}
      titleFa={story.titleFa}
      steps={story.steps}
    />
  );
}
