import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, Text } from '@/components/ui';
import type { SectionContent } from '@/lib/lesson-content';
import { getLearnPath, getLessonWithExercises } from '@/lib/learn-data';
import { ContinueButton } from './_continue-button';

/*
 * Learn-stage stub (Phase 5A) — title + the SUMMARY section's recap rows + the
 * completion button. The full sectioned reader (reading highlights, per-section
 * micro-checks, video embed) is Phase 5B; the section content already lives in
 * the DB with the lib/lesson-content shapes as the contract.
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

  const summary = lesson.sections.find((s) => s.kind === 'SUMMARY');
  const recap = summary ? ((summary.content as unknown as SectionContent).recap ?? []) : [];

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-6 bg-bg px-6 py-8"
      dir="ltr"
    >
      <header className="flex flex-col gap-1">
        <Text variant="caption" className="uppercase tracking-wider text-text-3">
          {lesson.unit.title}
        </Text>
        <Text variant="display" as="h1">
          {lesson.title}
        </Text>
      </header>

      {summary ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <Text variant="section" as="h2">
              {summary.titleEn}
            </Text>
            <Text variant="caption" fa className="text-text-2">
              {summary.titleFa}
            </Text>
          </div>
          <div className="flex flex-col">
            {recap.map((row) => (
              <div
                key={row.labelFa}
                className="flex flex-col gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <Text variant="caption" fa className="text-text-2">
                  {row.labelFa}
                </Text>
                <Text variant="body" className="font-bold">
                  {row.en}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="mt-auto pb-[env(safe-area-inset-bottom)]">
        <ContinueButton slug={slug} completed={node.completed} />
      </div>
    </div>
  );
}
