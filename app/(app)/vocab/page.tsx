import { Mascot, Text } from '@/components/ui';

/*
 * Vocabulary — placeholder for now (coming soon). The real section (flashcards:
 * word + Persian meaning + example + TTS) is a follow-up; this just gives the
 * Vocab tab a real, on-brand destination. Inside the (app) shell, so it carries
 * the tab bar; --tabbar-inset keeps the content clear of the floating bar.
 */
export default function VocabPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-[var(--tabbar-inset)] text-center">
      <Mascot pose="encourage" size={150} />
      <div className="flex flex-col items-center gap-2">
        <Text variant="display" as="h1">
          Vocabulary
        </Text>
        <span className="rounded-pill border border-border bg-surface-2 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-text-3">
          Coming soon
        </span>
      </div>
      <Text variant="body" fa className="max-w-xs text-text-2">
        به‌زودی: واژه‌ها را با فلش‌کارت یاد می‌گیری و مرور می‌کنی.
      </Text>
    </div>
  );
}
