import Link from 'next/link';
import { CaretRight, Lock } from '@phosphor-icons/react/dist/ssr';
import { Card, Text } from '@/components/ui';
import { getGuideIndex } from '@/lib/learn-data';

/*
 * Guide — grammar reference index, DB-driven. A read-only view of what the
 * learner studies: each unit's title + a one-line summary pulled from its
 * Learn-stage SUMMARY recap. Inside the (app) shell (TabBar already provided).
 * Composed from Card / Text + Phosphor + tokens. Request-time only → dynamic.
 */

export default async function GuidePage() {
  const units = await getGuideIndex();
  const active = units.filter((u) => !u.comingSoon);
  const soon = units.filter((u) => u.comingSoon);

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-1">
        <Text variant="section" as="h1">
          Guide
        </Text>
        <Text variant="caption">Look up any tense, anytime.</Text>
      </div>

      <section className="flex flex-col gap-3">
        <Text variant="caption" className="uppercase tracking-wider text-text-3">
          Present Tenses
        </Text>
        {active.map((t) => (
          <Link
            key={t.slug}
            href={`/guide/${t.slug}`}
            className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card
              padding="sm"
              shadow={1}
              className="flex items-center gap-4 transition-shadow hover:shadow-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Text variant="body" className="font-extrabold text-text-1">
                  {t.title}
                </Text>
                {t.summary ? <Text variant="caption">{t.summary}</Text> : null}
              </div>
              <CaretRight className="shrink-0 text-text-3" />
            </Card>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="caption" className="uppercase tracking-wider text-text-3">
          More — coming soon
        </Text>
        {soon.map((t) => (
          <Card key={t.slug} padding="sm" shadow={1} className="flex items-center gap-4 opacity-60">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text variant="body" className="font-extrabold text-text-1">
                {t.title}
              </Text>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface-3 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-text-3">
              <Lock weight="fill" /> Soon
            </span>
          </Card>
        ))}
      </section>
    </div>
  );
}
