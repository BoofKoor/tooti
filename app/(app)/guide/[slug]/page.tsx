import Link from 'next/link';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';
import { Card, Text } from '@/components/ui';

/*
 * Guide detail — a single tense. Mock data; full content for Present Simple, the
 * others lighter. The grammar explanation pairs English with a short Persian one
 * (a Persian-allowed island, handoff §2) via the fa Text variant.
 */

type TenseContent = {
  title: string;
  explanationEn: string;
  explanationFa: string;
  form: string;
  examples: string[];
};

const CONTENT: Record<string, TenseContent> = {
  'present-simple': {
    title: 'Present Simple',
    explanationEn:
      'Use the present simple for habits, general facts, and fixed schedules — things that are generally or always true.',
    explanationFa:
      'حالِ ساده برای عادت‌ها، حقیقت‌های کلی و برنامه‌های ثابت به‌کار می‌رود؛ کارهایی که معمولاً یا همیشه درست‌اند.',
    form: 'subject + base verb (+ s for he / she / it)',
    examples: [
      'She drinks coffee every morning.',
      'Water boils at 100°C.',
      'The train leaves at seven.',
    ],
  },
  'present-continuous': {
    title: 'Present Continuous',
    explanationEn: 'Use the present continuous for actions happening right now or around now.',
    explanationFa: 'حالِ استمراری برای کاری که همین حالا یا این روزها در جریان است به‌کار می‌رود.',
    form: 'subject + am / is / are + verb-ing',
    examples: ['They are studying right now.'],
  },
  'present-perfect': {
    title: 'Present Perfect',
    explanationEn: 'Use the present perfect for past actions that still matter now.',
    explanationFa: 'حالِ کامل برای کارهای گذشته‌ای که الان هم مهم‌اند به‌کار می‌رود.',
    form: 'subject + have / has + past participle',
    examples: ['I have finished my homework.'],
  },
  'present-perfect-continuous': {
    title: 'Present Perfect Continuous',
    explanationEn: 'Use it for actions that started in the past and are still going on now.',
    explanationFa: 'برای کاری که از گذشته شروع شده و هنوز ادامه دارد به‌کار می‌رود.',
    form: 'subject + have / has been + verb-ing',
    examples: ['She has been learning English for two years.'],
  },
};

function fallback(slug: string): TenseContent {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title,
    explanationEn: 'Full explanation coming soon.',
    explanationFa: 'توضیحِ کامل به‌زودی.',
    form: '—',
    examples: [],
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CONTENT[slug] ?? fallback(slug);

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <Link
        href="/guide"
        className="inline-flex w-fit items-center gap-1 font-bold text-text-2 transition-colors hover:text-text-1"
      >
        <CaretLeft weight="bold" /> Guide
      </Link>

      <Text variant="section" as="h1">
        {c.title}
      </Text>

      <Card className="flex flex-col gap-3">
        <Text variant="body">{c.explanationEn}</Text>
        <Text variant="body" fa>
          {c.explanationFa}
        </Text>
      </Card>

      <Card className="flex flex-col gap-2">
        <Text variant="caption" className="uppercase tracking-wider text-text-3">
          Form
        </Text>
        <Text variant="body" className="font-bold">
          {c.form}
        </Text>
      </Card>

      {c.examples.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <Text variant="caption" className="uppercase tracking-wider text-text-3">
            Examples
          </Text>
          <ul className="flex flex-col gap-2">
            {c.examples.map((ex, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="font-extrabold text-primary">
                  •
                </span>
                <Text variant="body" as="span">
                  {ex}
                </Text>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
