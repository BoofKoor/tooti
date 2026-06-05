import { PrismaClient, MedalTier } from '@prisma/client';

/**
 * Idempotent seed (re-runnable): units/lessons/medals are upserted by their
 * unique slug/key; each lesson's exercises are deleted then re-created so order
 * stays stable. Persian here is LESSON CONTENT and lives in the DB (the
 * /lib/i18n/fa.ts dict is only for UI-chrome islands).
 *
 * Seeds: 1 active unit + 3 coming-soon units, 3 lessons, 9 exercises, 8 medals.
 * Does NOT seed User/Progress/LessonCompletion/UserMedal — those come from real
 * sign-up.
 */
const prisma = new PrismaClient();

const units = [
  { slug: 'present-tenses', title: 'Present Tenses', order: 1, comingSoon: false },
  { slug: 'past-tenses', title: 'Past Tenses', order: 2, comingSoon: true },
  { slug: 'future-tenses', title: 'Future Tenses', order: 3, comingSoon: true },
  { slug: 'vocabulary', title: 'Vocabulary', order: 4, comingSoon: true },
];

// Canonical Guide-style slugs (see spec §12 re: Learn/Guide divergence).
const lessons = [
  { slug: 'present-simple', title: 'Simple Present', order: 1 },
  { slug: 'present-continuous', title: 'Present Continuous', order: 2 },
  { slug: 'present-perfect', title: 'Present Perfect', order: 3 },
];

type ExerciseSeed = {
  order: number;
  instructionEn: string;
  instructionFa: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationFa: string;
};

const exercisesByLesson: Record<string, ExerciseSeed[]> = {
  'present-simple': [
    {
      order: 1,
      instructionEn: 'Choose the correct form.',
      instructionFa: 'شکلِ درست را انتخاب کن',
      prompt: 'She ___ coffee every morning.',
      options: ['drinks', 'drink', 'is drinking', 'drank'],
      correctIndex: 0,
      explanationFa: 'سوم‌شخصِ مفرد در حالِ ساده «s» می‌گیرد.',
    },
    {
      order: 2,
      instructionEn: 'Pick the correct sentence.',
      instructionFa: 'جملهٔ درست را انتخاب کن',
      prompt: 'Which sentence is correct?',
      options: [
        'He don’t like tea.',
        'He doesn’t like tea.',
        'He not like tea.',
        'He no like tea.',
      ],
      correctIndex: 1,
      explanationFa: 'با سوم‌شخصِ مفرد از «doesn’t» استفاده می‌کنیم.',
    },
    {
      order: 3,
      instructionEn: 'Choose the correct form.',
      instructionFa: 'شکلِ درست را انتخاب کن',
      prompt: 'We ___ to school by bus.',
      options: ['go', 'goes', 'going', 'are go'],
      correctIndex: 0,
      explanationFa: 'با I/you/we/they فعل بدونِ «s» می‌آید.',
    },
  ],
  'present-continuous': [
    {
      order: 1,
      instructionEn: 'Complete the sentence.',
      instructionFa: 'جمله را کامل کن',
      prompt: 'They ___ in London right now.',
      options: ['live', 'lives', 'are living', 'living'],
      correctIndex: 2,
      explanationFa: 'برای کاری که همین حالا در جریان است، حالِ استمراری به‌کار می‌رود.',
    },
    {
      order: 2,
      instructionEn: 'Choose the correct form.',
      instructionFa: 'شکلِ درست را انتخاب کن',
      prompt: 'Listen! The baby ___.',
      options: ['cries', 'is crying', 'cry', 'cried'],
      correctIndex: 1,
      explanationFa:
        'برای کاری که در همین لحظه ادامه دارد از «is/are + فعل + ing» استفاده می‌کنیم.',
    },
    {
      order: 3,
      instructionEn: 'Pick the correct sentence.',
      instructionFa: 'جملهٔ درست را انتخاب کن',
      prompt: 'Which sentence is correct?',
      options: [
        'I am knowing the answer.',
        'I am know the answer.',
        'I know the answer.',
        'I knowing the answer.',
      ],
      correctIndex: 2,
      explanationFa: 'افعالِ حالتی مثلِ know معمولاً در زمانِ استمراری به‌کار نمی‌روند.',
    },
  ],
  'present-perfect': [
    {
      order: 1,
      instructionEn: 'Choose the correct form.',
      instructionFa: 'شکلِ درست را انتخاب کن',
      prompt: 'I ___ this film before.',
      options: ['have seen', 'has seen', 'saw', 'am seeing'],
      correctIndex: 0,
      explanationFa: 'حالِ کامل با «have/has + قسمتِ سومِ فعل» ساخته می‌شود.',
    },
    {
      order: 2,
      instructionEn: 'Complete the sentence.',
      instructionFa: 'جمله را کامل کن',
      prompt: 'She ___ just finished her homework.',
      options: ['have', 'has', 'is', 'was'],
      correctIndex: 1,
      explanationFa: 'با سوم‌شخصِ مفرد از «has» استفاده می‌کنیم.',
    },
    {
      order: 3,
      instructionEn: 'Pick the correct sentence.',
      instructionFa: 'جملهٔ درست را انتخاب کن',
      prompt: 'Which sentence is correct?',
      options: [
        'I have went there.',
        'I have go there.',
        'I have gone there.',
        'I have going there.',
      ],
      correctIndex: 2,
      explanationFa: 'قسمتِ سومِ «go» می‌شود «gone».',
    },
  ],
};

// Keys + tiers MUST match components/ui/Medal.tsx. Descriptions are placeholder
// criteria; exact thresholds are a Phase 4 decision.
const medals = [
  {
    key: 'first-lesson',
    name: 'First Lesson',
    tier: MedalTier.BRONZE,
    order: 1,
    description: 'Complete your first lesson.',
  },
  { key: '100-xp', name: '100 XP', tier: MedalTier.BRONZE, order: 2, description: 'Earn 100 XP.' },
  {
    key: '40-questions',
    name: '40 Questions',
    tier: MedalTier.BRONZE,
    order: 3,
    description: 'Answer 40 questions correctly.',
  },
  {
    key: 'perfect-lesson',
    name: 'Perfect',
    tier: MedalTier.SILVER,
    order: 4,
    description: 'Finish a lesson without losing a heart.',
  },
  { key: '500-xp', name: '500 XP', tier: MedalTier.SILVER, order: 5, description: 'Earn 500 XP.' },
  {
    key: 'week-champ',
    name: 'Week Champ',
    tier: MedalTier.GOLD,
    order: 6,
    description: 'Hit your daily goal 7 days in a row.',
  },
  {
    key: 'hot-streak',
    name: 'Hot Streak',
    tier: MedalTier.SPECIAL,
    order: 7,
    description: 'Keep a 30-day streak.',
  },
  {
    key: 'tooti-favorite',
    name: "Tooti's Favorite",
    tier: MedalTier.SPECIAL,
    order: 8,
    description: 'A special surprise from Tooti.',
  },
];

async function main() {
  // Units — idempotent by unique slug.
  for (const u of units) {
    await prisma.unit.upsert({
      where: { slug: u.slug },
      create: u,
      update: { title: u.title, order: u.order, comingSoon: u.comingSoon },
    });
  }

  // Lessons live in the active present-tenses unit.
  const presentTenses = await prisma.unit.findUniqueOrThrow({
    where: { slug: 'present-tenses' },
  });

  for (const l of lessons) {
    const lesson = await prisma.lesson.upsert({
      where: { slug: l.slug },
      create: { slug: l.slug, title: l.title, order: l.order, unitId: presentTenses.id },
      update: { title: l.title, order: l.order, unitId: presentTenses.id },
    });

    // Replace exercises wholesale so re-runs keep order stable.
    await prisma.exercise.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.exercise.createMany({
      data: exercisesByLesson[l.slug].map((e) => ({
        lessonId: lesson.id,
        order: e.order,
        type: 'MCQ',
        instructionEn: e.instructionEn,
        instructionFa: e.instructionFa,
        prompt: e.prompt,
        options: e.options,
        correctIndex: e.correctIndex,
        explanationFa: e.explanationFa,
      })),
    });
  }

  // Medals — idempotent by unique key.
  for (const m of medals) {
    await prisma.medal.upsert({
      where: { key: m.key },
      create: m,
      update: { name: m.name, description: m.description, tier: m.tier, order: m.order },
    });
  }

  const [unitCount, lessonCount, exerciseCount, medalCount] = await Promise.all([
    prisma.unit.count(),
    prisma.lesson.count(),
    prisma.exercise.count(),
    prisma.medal.count(),
  ]);
  console.log(
    `Seed complete: ${unitCount} units, ${lessonCount} lessons, ${exerciseCount} exercises, ${medalCount} medals.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
