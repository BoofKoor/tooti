import type { LessonKind } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Server-only Learn-engine queries shared by the Learn path, the runner and the
 * Learn-stage page. Sequential unlock: a lesson is unlocked iff it's the first
 * in its unit or the previous `order` is completed; coming-soon units are never
 * playable.
 */

export type LearnLesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  order: number;
  completed: boolean;
  crownLevel: number;
  unlocked: boolean;
};

export type LearnUnit = {
  slug: string;
  title: string;
  comingSoon: boolean;
  lessons: LearnLesson[];
};

export async function getLearnPath(userId: string): Promise<LearnUnit[]> {
  const [units, completions] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' } } },
    }),
    prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true, crownLevel: true, perfect: true },
    }),
  ]);
  const done = new Map(completions.map((c) => [c.lessonId, c]));
  return units.map((u) => ({
    slug: u.slug,
    title: u.title,
    comingSoon: u.comingSoon,
    lessons: u.lessons.map((l, i) => {
      const completion = done.get(l.id) ?? null;
      const prev = i === 0 ? null : u.lessons[i - 1];
      const unlocked = !u.comingSoon && (i === 0 || (prev != null && done.has(prev.id)));
      return {
        slug: l.slug,
        title: l.title,
        kind: l.kind,
        order: l.order,
        completed: !!completion,
        crownLevel: completion?.crownLevel ?? 0,
        unlocked,
      };
    }),
  }));
}

export async function getLessonWithExercises(slug: string) {
  return prisma.lesson.findUnique({
    where: { slug },
    include: {
      exercises: { orderBy: { order: 'asc' } },
      sections: { orderBy: { order: 'asc' } },
      unit: true,
    },
  });
}
