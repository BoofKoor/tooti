'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, Mascot, Text } from '@/components/ui';

/*
 * Practice — review landing. Mock data, English-first. Inside the (app) shell
 * (TabBar already provided). Composed from Mascot / Text / Button / Card.
 */

const LEARNED = [
  { name: 'Present Simple', note: 'Reviewed 2 days ago' },
  { name: 'Present Continuous', note: 'Reviewed 5 days ago' },
  { name: 'Present Perfect', note: 'New — not reviewed yet' },
];

export default function PracticePage() {
  const router = useRouter();
  // First real practice set (Phase 5A); a locked lesson bounces back to /learn.
  const startReview = () => router.push('/lesson/present-simple-practice-1');

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 pb-[var(--tabbar-inset)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot pose="encourage" size={120} />
        <Text variant="section" as="h1">
          Practice
        </Text>
        <Text variant="body">Strengthen the tenses you’ve learned.</Text>
        <Button variant="primary" size="lg" className="w-full max-w-xs" onClick={startReview}>
          Start a review
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <Text variant="caption" className="uppercase tracking-wider text-text-3">
          Your tenses
        </Text>
        {LEARNED.map((t) => (
          <Card key={t.name} padding="sm" shadow={1} className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text variant="body" className="font-extrabold text-text-1">
                {t.name}
              </Text>
              <Text variant="caption">{t.note}</Text>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={startReview}>
              Review
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
