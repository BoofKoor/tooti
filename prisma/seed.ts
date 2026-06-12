import { LessonKind, MedalTier, Prisma, PrismaClient, SectionKind } from '@prisma/client';
import type { SectionContent } from '../lib/lesson-content';

/**
 * Idempotent seed (re-runnable): units/lessons/medals are upserted by their
 * unique slug/key — stale units/lessons (old catalogs) are deleted — and each
 * lesson's exercises + sections are deleted then re-created so order stays
 * stable. Persian here is LESSON CONTENT and lives in the DB (the
 * /lib/i18n/fa.ts dict is only for UI-chrome islands).
 *
 * Seeds: 1 active unit + 4 coming-soon units, 5 lessons (Learn → Practice ×3 →
 * Test), 28 exercises, 8 Learn-stage sections, 8 medals. Does NOT seed
 * User/Progress/LessonCompletion/UserMedal/DailyXp — those come from real use.
 */
const prisma = new PrismaClient();

const units = [
  { slug: 'present-simple', title: 'Present Simple', order: 1, comingSoon: false },
  { slug: 'present-continuous', title: 'Present Continuous', order: 2, comingSoon: true },
  { slug: 'present-perfect', title: 'Present Perfect', order: 3, comingSoon: true },
  { slug: 'past-tenses', title: 'Past Tenses', order: 4, comingSoon: true },
  { slug: 'vocabulary', title: 'Vocabulary', order: 5, comingSoon: true },
];

// The Present Simple topic: Learn stage → 3 practice sets → checkpoint test.
const lessons = [
  {
    slug: 'present-simple-learn',
    title: 'Learn: Present Simple',
    order: 1,
    kind: LessonKind.LESSON,
  },
  { slug: 'present-simple-practice-1', title: 'From the story', order: 2, kind: LessonKind.REVIEW },
  { slug: 'present-simple-practice-2', title: 'Verb forms', order: 3, kind: LessonKind.REVIEW },
  {
    slug: 'present-simple-practice-3',
    title: 'Questions & negatives',
    order: 4,
    kind: LessonKind.REVIEW,
  },
  {
    slug: 'present-simple-test',
    title: 'Checkpoint test',
    order: 5,
    kind: LessonKind.SECTION_TEST,
  },
];

// ── Learn-stage sections (present-simple-learn) — content shapes are the
// lib/lesson-content.ts contract, rendered by Phase 5B. ──
type SectionSeed = {
  order: number;
  kind: SectionKind;
  titleEn: string;
  titleFa: string;
  content: SectionContent;
};

const learnSections: SectionSeed[] = [
  {
    order: 1,
    kind: SectionKind.READING,
    titleEn: "A Day in Maryam's Life",
    titleFa: 'یک روز از زندگیِ مریم',
    content: {
      paragraphs: [
        'Maryam **is** a student. She **lives** in Shiraz with her family. Every morning, she **wakes up** at six and **drinks** a glass of milk. She **doesn’t eat** a big breakfast, because she **isn’t** hungry in the morning.',
        'Her school **starts** at eight, so she **takes** the bus at seven thirty. After school, Maryam and her friends **play** volleyball. They **don’t play** every day — only on Saturdays and Mondays.',
        'In the evening, she **does** her homework and **watches** TV. Her brother Ali **doesn’t watch** TV; he **plays** video games. Before bed, Maryam sometimes **reads** a book. **Does** she **like** her busy life? Yes, she **does**!',
      ],
      check: {
        prompt: "In the story, which verb describes Maryam's everyday habit?",
        options: ['lives', 'lived', 'is living', 'will live'],
        correctIndex: 0,
        explanationFa: 'کارهای روزمره و عادت‌ها با حالِ ساده گفته می‌شوند.',
      },
    },
  },
  {
    order: 2,
    kind: SectionKind.CONCEPT,
    titleEn: 'When do we use it?',
    titleFa: 'کِی از حالِ ساده استفاده می‌کنیم؟',
    content: {
      bodyFa:
        'حالِ ساده برای سه چیز است: عادت‌ها و کارهای تکراری، حقیقت‌های کلی، و برنامه‌های ثابت (مثلِ ساعتِ مدرسه یا قطار).',
      examples: [
        {
          en: 'She wakes up at six every morning.',
          fa: 'هر روز ساعتِ شش بیدار می‌شود.',
          note: 'عادت — از متن',
        },
        { en: 'Water boils at 100°C.', fa: 'آب در ۱۰۰ درجه می‌جوشد.', note: 'حقیقتِ کلی' },
        {
          en: 'School starts at eight.',
          fa: 'مدرسه ساعتِ هشت شروع می‌شود.',
          note: 'برنامهٔ ثابت — از متن',
        },
      ],
      check: {
        prompt: 'Which sentence is a general truth?',
        options: [
          'The sun rises in the east.',
          'I am eating lunch.',
          'She visited Shiraz.',
          'We will play tomorrow.',
        ],
        correctIndex: 0,
        explanationFa: 'خورشید همیشه از شرق طلوع می‌کند — حقیقتِ کلی، پس حالِ ساده.',
      },
    },
  },
  {
    order: 3,
    kind: SectionKind.CONCEPT,
    titleEn: 'Positive form (+ the -s rule)',
    titleFa: 'جملهٔ مثبت و قانونِ s',
    content: {
      bodyFa:
        'با I/you/we/they فعلِ ساده می‌آید؛ با he/she/it فعل s می‌گیرد. املای s: بیشترِ فعل‌ها فقط s (play → plays)؛ فعل‌های مختوم به -ch/-sh/-s/-x/-o می‌شوند es (watch → watches، go → goes)؛ حرفِ بی‌صدا + y می‌شود ies (study → studies).',
      examples: [
        { en: 'They play volleyball after school.', note: 'از متن' },
        { en: 'She watches TV in the evening.', note: 'watch → watches — از متن' },
        { en: 'He studies English.', note: 'study → studies' },
      ],
      check: {
        prompt: 'He ___ to school by bus.',
        options: ['goes', 'go', 'gos', 'going'],
        correctIndex: 0,
        explanationFa: 'go با -o تمام می‌شود → goes.',
      },
    },
  },
  {
    order: 4,
    kind: SectionKind.CONCEPT,
    titleEn: 'Negative',
    titleFa: 'جملهٔ منفی',
    content: {
      bodyFa:
        'منفی با don’t (برای I/you/we/they) و doesn’t (برای he/she/it) ساخته می‌شود و بعدش فعلِ ساده می‌آید — s را doesn’t برمی‌دارد.',
      examples: [
        { en: 'She doesn’t eat a big breakfast.', note: 'از متن' },
        { en: 'They don’t play every day.', note: 'از متن' },
        { en: 'Ali doesn’t watch TV.', note: 'doesn’t + فعلِ ساده (نه watches)' },
      ],
      check: {
        prompt: 'He ___ coffee.',
        options: ['doesn’t drink', 'don’t drink', 'doesn’t drinks', 'not drink'],
        correctIndex: 0,
        explanationFa: 'سوم‌شخص → doesn’t + فعلِ ساده.',
      },
    },
  },
  {
    order: 5,
    kind: SectionKind.CONCEPT,
    titleEn: 'Questions & short answers',
    titleFa: 'سؤال و جوابِ کوتاه',
    content: {
      bodyFa:
        'سؤال با Do/Does ساخته می‌شود: Does برای he/she/it و Do برای بقیه. جوابِ کوتاه: Yes, she does. / No, he doesn’t. سؤالِ Wh هم همین‌طور: Where does she live?',
      examples: [
        { en: 'Does she like her busy life? — Yes, she does!', note: 'از متن' },
        { en: 'Do you speak English? — Yes, I do.' },
        { en: 'Where does Maryam live? — In Shiraz.' },
      ],
      check: {
        prompt: '___ your brother play football?',
        options: ['Does', 'Do', 'Is', 'Has'],
        correctIndex: 0,
        explanationFa: 'سوم‌شخصِ مفرد → Does.',
      },
    },
  },
  {
    order: 6,
    kind: SectionKind.CONCEPT,
    titleEn: 'Signal words',
    titleFa: 'نشانه‌های حالِ ساده',
    content: {
      bodyFa:
        'این کلمه‌ها معمولاً با حالِ ساده می‌آیند: قیدهای تکرار (always، usually، often، sometimes، never — قبل از فعلِ اصلی) و عبارت‌های زمانی (every day، on Mondays، at night، in the morning).',
      examples: [
        { en: 'Maryam sometimes reads a book before bed.', note: 'از متن — sometimes قبل از فعل' },
        { en: 'They play volleyball on Saturdays and Mondays.', note: 'از متن' },
        { en: 'I never drink coffee at night.' },
      ],
      check: {
        prompt: 'He ___ late for school.',
        options: ['is never', 'never is', 'is being never', 'never'],
        correctIndex: 0,
        explanationFa: 'قیدِ تکرار بعد از فعلِ to be می‌آید: is never.',
      },
    },
  },
  {
    order: 7,
    kind: SectionKind.SUMMARY,
    titleEn: 'In one look',
    titleFa: 'در یک نگاه',
    content: {
      recap: [
        { labelFa: 'کاربرد', en: 'habits · general truths · fixed schedules' },
        {
          labelFa: 'مثبت',
          en: 'I/you/we/they + verb · he/she/it + verb-s (watches, goes, studies)',
        },
        { labelFa: 'منفی', en: 'don’t / doesn’t + base verb' },
        {
          labelFa: 'سؤال',
          en: 'Do/Does + subject + base verb? — Yes, she does. / No, he doesn’t.',
        },
        {
          labelFa: 'نشانه‌ها',
          en: 'always · usually · sometimes · never · every day · on Mondays',
        },
      ],
    },
  },
  {
    order: 8,
    kind: SectionKind.VIDEO,
    titleEn: 'Watch (optional)',
    titleFa: 'ویدیو (اختیاری)',
    content: { url: null, noteFa: 'یک مرورِ ویدیوییِ کوتاه — به‌زودی.' },
  },
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

function mcqSet(
  instructionEn: string,
  instructionFa: string,
  items: Array<{ prompt: string; options: string[]; explanationFa: string }>,
): ExerciseSeed[] {
  return items.map((it, i) => ({
    order: i + 1,
    instructionEn,
    instructionFa,
    prompt: it.prompt,
    options: it.options,
    correctIndex: 0, // authored with the correct option first
    explanationFa: it.explanationFa,
  }));
}

const exercisesByLesson: Record<string, ExerciseSeed[]> = {
  'present-simple-learn': [],
  'present-simple-practice-1': mcqSet('Choose the correct answer.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: 'Maryam ___ in Shiraz.',
      options: ['lives', 'live', 'is living', 'lived'],
      explanationFa: 'سوم‌شخصِ مفرد در حالِ ساده s می‌گیرد.',
    },
    {
      prompt: 'She ___ a big breakfast.',
      options: ['doesn’t eat', 'don’t eat', 'not eats', 'doesn’t eats'],
      explanationFa: 'منفیِ سوم‌شخص: doesn’t + فعلِ ساده.',
    },
    {
      prompt: 'Maryam and her friends ___ volleyball after school.',
      options: ['play', 'plays', 'is playing', 'played'],
      explanationFa: 'فاعلِ جمع → فعل بدونِ s.',
    },
    {
      prompt: '___ Maryam like her busy life? — Yes, she does.',
      options: ['Does', 'Do', 'Is', 'Has'],
      explanationFa: 'سؤالِ سوم‌شخص با Does ساخته می‌شود.',
    },
    {
      prompt: 'Ali ___ TV; he plays video games.',
      options: ['doesn’t watch', 'don’t watch', 'doesn’t watches', 'isn’t watch'],
      explanationFa: 'بعد از doesn’t فعلِ ساده می‌آید.',
    },
    {
      prompt: 'School ___ at eight.',
      options: ['starts', 'start', 'is start', 'starting'],
      explanationFa: 'برنامهٔ ثابت → حالِ ساده با s.',
    },
  ]),
  'present-simple-practice-2': mcqSet('Choose the correct form.', 'شکلِ درست را انتخاب کن', [
    {
      prompt: 'He ___ to work by car.',
      options: ['goes', 'go', 'gos', 'going'],
      explanationFa: 'go → goes.',
    },
    {
      prompt: 'She ___ English every day.',
      options: ['studies', 'studys', 'study', 'studying'],
      explanationFa: 'حرفِ بی‌صدا + y → ies.',
    },
    {
      prompt: 'My father ___ TV in the evening.',
      options: ['watches', 'watchs', 'watch', 'watching'],
      explanationFa: 'watch → watches.',
    },
    {
      prompt: 'I ___ coffee. I prefer tea.',
      options: ['don’t drink', 'doesn’t drink', 'not drink', 'don’t drinks'],
      explanationFa: 'اول‌شخص → don’t + فعلِ ساده.',
    },
    {
      prompt: 'The sun ___ in the east.',
      options: ['rises', 'rise', 'rising', 'is rise'],
      explanationFa: 'حقیقتِ کلی → حالِ ساده.',
    },
    {
      prompt: 'We ___ in Tehran.',
      options: ['live', 'lives', 'living', 'are live'],
      explanationFa: 'با we فعل بدونِ s می‌آید.',
    },
  ]),
  'present-simple-practice-3': mcqSet('Pick the correct option.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: '___ you speak English? — Yes, I do.',
      options: ['Do', 'Does', 'Are', 'Is'],
      explanationFa: 'با you سؤال با Do ساخته می‌شود.',
    },
    {
      prompt: '___ your sister play volleyball?',
      options: ['Does', 'Do', 'Is', 'Has'],
      explanationFa: 'سوم‌شخصِ مفرد → Does.',
    },
    {
      prompt: 'They ___ on Sundays.',
      options: ['don’t work', 'doesn’t work', 'not work', 'don’t works'],
      explanationFa: 'فاعلِ جمع → don’t + فعلِ ساده.',
    },
    {
      prompt: 'Does he like football? — No, he ___.',
      options: ['doesn’t', 'don’t', 'isn’t', 'not'],
      explanationFa: 'جوابِ کوتاهِ منفی: No, he doesn’t.',
    },
    {
      prompt: 'Where ___ she live?',
      options: ['does', 'do', 'is', 'are'],
      explanationFa: 'سؤالِ Wh با does برای سوم‌شخص.',
    },
    {
      prompt: 'He doesn’t ___ TV at night.',
      options: ['watch', 'watches', 'watching', 'watched'],
      explanationFa: 'بعد از doesn’t فعلِ ساده.',
    },
  ]),
  'present-simple-test': mcqSet('Choose the correct answer.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: 'Sara ___ up at 6 every day.',
      options: ['wakes', 'wake', 'is waking', 'woke'],
      explanationFa: 'عادتِ روزانه → حالِ ساده با s.',
    },
    {
      prompt: 'I ___ like cold weather.',
      options: ['don’t', 'doesn’t', 'am not', 'not'],
      explanationFa: 'اول‌شخص → don’t.',
    },
    {
      prompt: '___ they live near you? — Yes, they do.',
      options: ['Do', 'Does', 'Are', 'Is'],
      explanationFa: 'با they سؤال با Do.',
    },
    {
      prompt: 'My brother ___ his homework after dinner.',
      options: ['does', 'do', 'doing', 'is do'],
      explanationFa: 'سوم‌شخص → does.',
    },
    {
      prompt: 'Water ___ at 100 degrees.',
      options: ['boils', 'boil', 'is boiling', 'boiled'],
      explanationFa: 'حقیقتِ کلی → حالِ ساده.',
    },
    {
      prompt: 'She ___ to music on the bus.',
      options: ['listens', 'listen', 'listening', 'is listen'],
      explanationFa: 'سوم‌شخص s می‌گیرد.',
    },
    {
      prompt: 'We ___ TV on school nights.',
      options: ['don’t watch', 'doesn’t watch', 'don’t watches', 'not watch'],
      explanationFa: 'جمع → don’t + فعلِ ساده.',
    },
    {
      prompt: 'What time ___ the film start?',
      options: ['does', 'do', 'is', 'will'],
      explanationFa: 'سؤالِ Wh دربارهٔ برنامهٔ ثابت → does.',
    },
    {
      prompt: 'Does Maryam read before bed? — Yes, she ___.',
      options: ['does', 'do', 'is', 'reads'],
      explanationFa: 'جوابِ کوتاه: Yes, she does.',
    },
    {
      prompt: 'He usually ___ tea, but today he is drinking coffee.',
      options: ['drinks', 'drink', 'is drinking', 'drank'],
      explanationFa: 'عادت → حالِ ساده؛ «امروز» استثناست.',
    },
  ]),
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
  // Units — idempotent by unique slug; drop units from older catalogs so the
  // path only ever shows the current topics (dev data — cascades are fine).
  for (const u of units) {
    await prisma.unit.upsert({
      where: { slug: u.slug },
      create: u,
      update: { title: u.title, order: u.order, comingSoon: u.comingSoon },
    });
  }
  await prisma.unit.deleteMany({ where: { slug: { notIn: units.map((u) => u.slug) } } });

  // Lessons live in the active present-simple unit; drop stale ones first so
  // the @@unique([unitId, order]) slots are free.
  const presentSimple = await prisma.unit.findUniqueOrThrow({
    where: { slug: 'present-simple' },
  });
  await prisma.lesson.deleteMany({ where: { slug: { notIn: lessons.map((l) => l.slug) } } });

  for (const l of lessons) {
    const lesson = await prisma.lesson.upsert({
      where: { slug: l.slug },
      create: {
        slug: l.slug,
        title: l.title,
        order: l.order,
        kind: l.kind,
        unitId: presentSimple.id,
      },
      update: { title: l.title, order: l.order, kind: l.kind, unitId: presentSimple.id },
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

    // Same wholesale-replace pattern for the Learn-stage sections.
    await prisma.lessonSection.deleteMany({ where: { lessonId: lesson.id } });
    if (l.kind === LessonKind.LESSON) {
      await prisma.lessonSection.createMany({
        data: learnSections.map((s) => ({
          lessonId: lesson.id,
          order: s.order,
          kind: s.kind,
          titleEn: s.titleEn,
          titleFa: s.titleFa,
          content: s.content as Prisma.InputJsonValue,
        })),
      });
    }
  }

  // Medals — idempotent by unique key.
  for (const m of medals) {
    await prisma.medal.upsert({
      where: { key: m.key },
      create: m,
      update: { name: m.name, description: m.description, tier: m.tier, order: m.order },
    });
  }

  const [unitCount, lessonCount, exerciseCount, sectionCount, medalCount] = await Promise.all([
    prisma.unit.count(),
    prisma.lesson.count(),
    prisma.exercise.count(),
    prisma.lessonSection.count(),
    prisma.medal.count(),
  ]);
  console.log(
    `Seed complete: ${unitCount} units, ${lessonCount} lessons, ${exerciseCount} exercises, ` +
      `${sectionCount} sections, ${medalCount} medals.`,
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
