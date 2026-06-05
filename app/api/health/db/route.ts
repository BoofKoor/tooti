import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Request-time only (never evaluated at build): lets seed correctness be checked
// headlessly via GET /api/health/db.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [units, lessons, exercises, medals] = await Promise.all([
      prisma.unit.count(),
      prisma.lesson.count(),
      prisma.exercise.count(),
      prisma.medal.count(),
    ]);
    return NextResponse.json({ status: 'ok', units, lessons, exercises, medals });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: String(e) }, { status: 503 });
  }
}
