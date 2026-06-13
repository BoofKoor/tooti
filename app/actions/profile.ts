'use server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Update the signed-in user's display name (Profile → Edit-profile sheet).
 * Auth-gated, trimmed, length-bounded; revalidates /profile so the new name
 * shows after the sheet closes. Only writes the existing User.name column.
 */
export async function updateName(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Not signed in' };
  const raw = String(formData.get('name') ?? '').trim();
  if (raw.length < 1) return { ok: false, error: 'Name cannot be empty' };
  if (raw.length > 40) return { ok: false, error: 'Name is too long' };
  await prisma.user.update({ where: { id: session.user.id }, data: { name: raw } });
  revalidatePath('/profile');
  return { ok: true };
}
