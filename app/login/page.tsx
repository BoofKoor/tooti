import Link from 'next/link';
import { EnvelopeSimple, SignOut } from '@phosphor-icons/react/dist/ssr';
import { auth, signIn, signOut } from '@/lib/auth';
import { Button, Mascot } from '@/components/ui';

/** Official multi-color Google "G" mark for the sign-in button. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

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
              <GoogleG />
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
