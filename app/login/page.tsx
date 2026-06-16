import Link from 'next/link';
import { EnvelopeSimple, GoogleLogo, SignOut } from '@phosphor-icons/react/dist/ssr';
import { auth, signIn, signOut } from '@/lib/auth';
import { Button, Mascot } from '@/components/ui';

/**
 * Sign-in / sign-out — public (outside the (app) group), styled to match the
 * Welcome hero: teal-glow background, bold brand header, and an elevated auth
 * panel. Both providers: Google OAuth + email magic-link (in dev the link is
 * logged to the server console). Login is a sanctioned Persian island
 * (handoff §2) — a short Persian welcome sits under the English header.
 */
export default async function LoginPage() {
  const session = await auth();

  async function googleSignIn() {
    'use server';
    await signIn('google', { redirectTo: '/learn' });
  }

  async function emailSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    if (email) await signIn('nodemailer', { email, redirectTo: '/learn' });
  }

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <main className="scr-auth" dir="ltr">
      <div className="auth-head">
        <div className="auth-mascot">
          <Mascot pose={session?.user ? 'celebrate' : 'encourage'} size={104} />
        </div>
        <h1 className="auth-title">Welcome to Tooti</h1>
        <p className="auth-sub">
          {session?.user ? "You're signed in." : 'Sign in to start learning.'}
        </p>
        <p className="auth-fa fa">خوش آمدی</p>
      </div>

      {session?.user ? (
        <div className="auth-card">
          <p className="auth-signed">
            Signed in as <span>{session.user.email}</span>
          </p>
          <Link href="/learn" className="btn btn--primary btn--md no-underline">
            <span className="btn__label">Go to app</span>
          </Link>
          <form action={doSignOut}>
            <Button type="submit" variant="secondary" className="w-full">
              <SignOut weight="bold" />
              Sign out
            </Button>
          </form>
        </div>
      ) : (
        <div className="auth-card">
          <form action={googleSignIn}>
            <Button type="submit" variant="secondary" className="w-full">
              <GoogleLogo weight="bold" />
              Continue with Google
            </Button>
          </form>

          <div className="auth-divider">
            <span aria-hidden="true" />
            or
            <span aria-hidden="true" />
          </div>

          <form action={emailSignIn} className="auth-email-form">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="auth-field"
            />
            <Button type="submit" className="w-full">
              <EnvelopeSimple weight="bold" />
              Email me a magic link
            </Button>
          </form>
        </div>
      )}

      <p className="auth-foot">Tooti keeps your progress synced across all your devices.</p>
    </main>
  );
}
