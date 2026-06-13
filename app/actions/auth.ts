'use server';
import { signOut } from '@/lib/auth';

/**
 * Sign the user out and return to the welcome screen. A server action so it
 * works with the database-session setup without a client SessionProvider —
 * called from a <form action={signOutAction}> in the Profile settings menu.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
