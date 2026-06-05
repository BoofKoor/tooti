import Link from 'next/link';
import { CaretRight, Lock } from '@phosphor-icons/react/dist/ssr';
import { Card, Text } from '@/components/ui';

/*
 * Guide — grammar reference index. Mock data, English-first. Inside the (app)
 * shell (TabBar already provided). Composed from Card / Text + Phosphor + tokens.
 */

const PRESENT_TENSES = [
  {
    slug: 'present-simple',
    name: 'Present Simple',
    summary: 'Habits, facts, and fixed schedules.',
  },
  {
    slug: 'present-continuous',
    name: 'Present Continuous',
    summary: 'Actions happening right now.',
  },
  {
    slug: 'present-perfect',
    name: 'Present Perfect',
    summary: 'Past actions with present relevance.',
  },
  {
    slug: 'present-perfect-continuous',
    name: 'Present Perfect Continuous',
    summary: 'Ongoing actions up to now.',
  },
];

const SOON = [
  { name: 'Past Tenses', summary: 'Simple, continuous, and perfect.' },
  { name: 'Future Tenses', summary: 'will, going to, and more.' },
];

export default function GuidePage() {
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
        {PRESENT_TENSES.map((t) => (
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
                  {t.name}
                </Text>
                <Text variant="caption">{t.summary}</Text>
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
        {SOON.map((t) => (
          <Card key={t.name} padding="sm" shadow={1} className="flex items-center gap-4 opacity-60">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text variant="body" className="font-extrabold text-text-1">
                {t.name}
              </Text>
              <Text variant="caption">{t.summary}</Text>
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
