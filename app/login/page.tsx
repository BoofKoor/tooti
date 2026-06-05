import Link from 'next/link';
import { EnvelopeSimple, GoogleLogo, SignOut } from '@phosphor-icons/react/dist/ssr';
import { auth, signIn, signOut } from '@/lib/auth';
import { Button, Card, Mascot, Text } from '@/components/ui';

/**
 * Sign-in / sign-out — public (outside the (app) group). Both providers:
 * Google OAuth + email magic-link (in dev the link is logged to the server
 * console). Login is a sanctioned Persian island (handoff §2), so a short
 * Persian welcome line sits beside the English action labels. Composed from the
 * UI primitives in the welcome-screen style; tokens only, logical CSS.
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
    <main className="mx-auto flex min-h-dvh max-w-app flex-col items-center justify-center gap-8 px-6 py-12">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot pose={session?.user ? 'celebrate' : 'encourage'} size={112} />
        <div className="flex flex-col items-center gap-1">
          <Text variant="display" as="h1">
            Tooti
          </Text>
          <Text variant="body" fa>
            خوش آمدی
          </Text>
        </div>
      </div>

      {session?.user ? (
        <Card className="flex w-full max-w-xs flex-col items-center gap-5 text-center" padding="lg">
          <Text variant="body">
            Signed in as <span className="font-extrabold text-text-1">{session.user.email}</span>
          </Text>
          <div className="flex w-full flex-col gap-3">
            <Link href="/learn" className="btn btn--primary btn--md w-full no-underline">
              <span className="btn__label">Go to app</span>
            </Link>
            <form action={doSignOut} className="w-full">
              <Button type="submit" variant="secondary" className="w-full">
                <SignOut weight="bold" />
                Sign out
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="flex w-full max-w-xs flex-col gap-5" padding="lg">
          <form action={googleSignIn}>
            <Button type="submit" variant="secondary" className="w-full">
              <GoogleLogo weight="bold" />
              Continue with Google
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-border" aria-hidden="true" />
            <Text variant="caption" className="text-text-3">
              or
            </Text>
            <span className="flex-1 border-t border-border" aria-hidden="true" />
          </div>

          <form action={emailSignIn} className="flex flex-col gap-3">
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
        </Card>
      )}

      <Text variant="caption" className="max-w-xs text-center text-text-3">
        Tooti keeps your progress synced across devices.
      </Text>
    </main>
  );
}
