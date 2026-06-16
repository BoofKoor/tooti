'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenText, Flame, Microphone } from '@phosphor-icons/react/dist/ssr';
import { Button, Mascot } from '@/components/ui';

/*
 * Welcome / entry — the first impression. A brand hero (celebrate mascot on a
 * teal glow) with a benefit-led headline, sub-line and three pillar highlights
 * (lessons · speaking · streak), over a primary "Get started" CTA + Log in.
 * English-only (handoff §2). Both CTAs route to /login (magic-link + Google).
 */
export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="scr-welcome" dir="ltr">
      <div className="welcome-hero">
        <div className="welcome-mascot">
          <Mascot pose="celebrate" />
        </div>
        <h1 className="welcome-title">
          Learn English
          <br />
          with <span className="accent">Tooti</span>
        </h1>
        <p className="welcome-sub">
          Bite-sized lessons, real conversations, and a streak that keeps you going.
        </p>
        <ul className="welcome-features">
          <li>
            <span className="ic">
              <BookOpenText weight="fill" />
            </span>
            Bite-sized lessons
          </li>
          <li>
            <span className="ic">
              <Microphone weight="fill" />
            </span>
            Speak &amp; listen
          </li>
          <li>
            <span className="ic">
              <Flame weight="fill" />
            </span>
            Build a daily streak
          </li>
        </ul>
      </div>

      <div className="welcome-actions">
        <Button variant="primary" size="lg" onClick={() => router.push('/login')}>
          Get started
        </Button>
        <div className="alt-link">
          Have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
