import { Cards } from '@phosphor-icons/react/dist/ssr';
import { Mascot, Text } from '@/components/ui';

/*
 * Vocabulary — placeholder for now (coming soon). The real section (flashcards:
 * word + meaning + example + TTS) is a follow-up; this just gives the Vocab tab
 * a real, on-brand destination. Inside the (app) shell, so it carries the tab
 * bar; --tabbar-inset keeps the content clear of the floating bar. English-only,
 * per the English-first policy (no comprehension-critical island here).
 */
const PREVIEW = ['Flashcards', 'Audio', 'Examples'];

export default function VocabPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-[var(--tabbar-inset)] text-center">
      <Mascot pose="encourage" size={150} />
      <div className="flex flex-col items-center gap-3">
        <Text variant="display" as="h1">
          Vocabulary
        </Text>
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-text-3">
          <Cards weight="fill" /> Coming soon
        </span>
      </div>
      <Text variant="body" className="max-w-xs text-text-2">
        Grow your word power with flashcards — hear each word, see what it means, and learn it in a
        real example.
      </Text>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PREVIEW.map((item) => (
          <span
            key={item}
            className="rounded-pill bg-surface-2 px-3 py-1 text-xs font-bold text-text-2"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
