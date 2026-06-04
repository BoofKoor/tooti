'use client';

import { useRouter } from 'next/navigation';
import { Button, Mascot, Text } from '@/components/ui';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <Mascot pose="encourage" size={140} />

      {/* Wordmark — welcome is a Persian-allowed island (handoff §2). */}
      <div className="flex flex-col items-center gap-1">
        <Text variant="display" as="h1">
          Tooti
        </Text>
        <Text variant="display" fa as="p">
          طوطی
        </Text>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Text variant="body">Learn English, the playful way.</Text>
        <Text variant="body" fa>
          انگلیسی را بازی‌گونه یاد بگیر.
        </Text>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <Button className="w-full" onClick={() => router.push('/learn')}>
          Get started
        </Button>
        {/* Auth lands in Phase 3 — placeholder route for now. */}
        <button
          type="button"
          onClick={() => router.push('/learn')}
          className="text-sm font-bold text-text-3 transition-colors duration-fast ease-out hover:text-text-1"
        >
          I already have an account
        </button>
      </div>
    </main>
  );
}
