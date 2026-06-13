import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';
import { Card, Text } from '@/components/ui';
import type { SectionContent } from '@/lib/lesson-content';
import { getGuideEntry } from '@/lib/learn-data';

/*
 * Guide detail — a single tense, DB-driven. Read-only reference derived from the
 * unit's Learn-stage CONCEPT + SUMMARY sections (same content the learner
 * studies, zero duplicated copy). The Persian body/examples are the sanctioned
 * `fa` islands. Request-time only → dynamic.
 */

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getGuideEntry(slug);
  if (!entry) notFound();

  const summary = entry.summary ? (entry.summary.content as unknown as SectionContent) : null;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-[var(--tabbar-inset)]">
      <Link
        href="/guide"
        className="inline-flex w-fit items-center gap-1 font-bold text-text-2 transition-colors hover:text-text-1"
      >
        <CaretLeft weight="bold" /> Guide
      </Link>

      <Text variant="section" as="h1">
        {entry.title}
      </Text>

      {entry.concepts.map((section) => {
        const c = section.content as unknown as SectionContent;
        return (
          <Card key={section.id} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <Text variant="body" className="font-extrabold text-text-1">
                {section.titleEn}
              </Text>
              <Text variant="caption" fa className="text-text-2">
                {section.titleFa}
              </Text>
            </div>
            {c.bodyFa ? (
              <Text variant="body" fa>
                {c.bodyFa}
              </Text>
            ) : null}
            {c.examples?.length ? (
              <div className="flex flex-col">
                {c.examples.map((ex) => (
                  <div
                    key={ex.en}
                    className="flex flex-col gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <Text variant="body" className="font-bold">
                      {ex.en}
                    </Text>
                    {ex.fa ? (
                      <Text variant="body" fa className="text-text-2">
                        {ex.fa}
                      </Text>
                    ) : null}
                    {ex.note ? (
                      <Text variant="caption" fa className="text-text-3">
                        {ex.note}
                      </Text>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        );
      })}

      {summary?.recap?.length ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <Text variant="body" className="font-extrabold text-text-1">
              In one look
            </Text>
            <Text variant="caption" fa className="text-text-2">
              در یک نگاه
            </Text>
          </div>
          <div className="flex flex-col">
            {summary.recap.map((row) => (
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
    </div>
  );
}
