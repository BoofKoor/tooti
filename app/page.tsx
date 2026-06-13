'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Mascot } from '@/components/ui';

/*
 * Welcome / entry — ported faithfully from design/styleguide.html (.scr-welcome,
 * English version). Centered celebrate-mascot hero with the "Hi, I'm Tooti!"
 * greeting + sub-line, and a full-width "Let's go!" CTA with a "Log in" link
 * beneath. English-only (handoff §2): the styleguide's UI-language picker is
 * intentionally omitted. Both CTAs route to /login (Auth.js magic-link + Google).
 */
export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="scr-welcome" dir="ltr">
      <div className="welcome-hero">
        <div className="welcome-mascot">
          <Mascot pose="celebrate" />
        </div>
        <h2 className="en">Hi, I&apos;m Tooti!</h2>
        <p className="welcome-sub">
          Your buddy for learning English — a tiny step a day is all it takes.
        </p>
      </div>

      <div className="welcome-actions">
        <Button variant="confirm" size="lg" onClick={() => router.push('/login')}>
          Let&apos;s go!
        </Button>
        <div className="alt-link">
          Have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
