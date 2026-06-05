import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';
import { prisma } from '@/lib/db';

/**
 * Auth.js (v5) — single Node-side config with database sessions and BOTH
 * providers (Google OAuth + email magic-link). Route protection is done in the
 * server-component layouts (app/(app)/layout.tsx, app/lesson/layout.tsx), not
 * edge middleware, so no edge `auth.config.ts` split is needed — and this file
 * (Prisma adapter + nodemailer, both Node-only) must never be imported into edge
 * middleware.
 */
const emailServer = process.env.EMAIL_SERVER;
const hasSmtp = !!emailServer;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  providers: [
    Google, // reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
    Nodemailer({
      // Auth.js's Nodemailer factory throws unless `server` is truthy — even when
      // sendVerificationRequest is overridden. With no SMTP (dev), pass a
      // placeholder that's never used to connect: the override below logs the
      // magic link instead of sending it.
      server: emailServer || 'smtp://localhost:1025',
      from: process.env.EMAIL_FROM ?? 'Tooti <login@tooti.academy>',
      // Dev fallback: no SMTP configured → log the magic link instead of sending it.
      ...(hasSmtp
        ? {}
        : {
            async sendVerificationRequest({ identifier, url }) {
              console.log(`\n[auth] Magic link for ${identifier}:\n${url}\n`);
            },
          }),
    }),
  ],
  events: {
    // Give every new account a Progress row with defaults (idempotent upsert so a
    // retry can't crash sign-up). Richer onboarding/seeding is a later phase.
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.progress.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    },
  },
});
