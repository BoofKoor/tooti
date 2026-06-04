import Link from 'next/link';
import { fa } from '@/lib/i18n/fa';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <span
        aria-hidden
        className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-tint text-4xl shadow-2"
      >
        🦜
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-text-1">Tooti</h1>
        <p className="text-text-2">Learn English, the playful way.</p>
        {/* Persian island (onboarding/welcome is comprehension-critical — §2). */}
        <p dir="rtl" className="fa text-text-3">
          {fa.welcome.tagline}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/learn"
          className="rounded-pill bg-primary px-6 py-3 font-bold text-text-inverse shadow-2 transition-transform duration-fast ease-playful hover:-translate-y-0.5"
        >
          Start learning
        </Link>
        <Link
          href="/tokens"
          className="rounded-pill bg-surface px-6 py-3 font-bold text-text-2 shadow-1 ring-1 ring-border transition-colors duration-fast hover:bg-surface-2"
        >
          View design tokens
        </Link>
      </div>
    </main>
  );
}
