import {
  ExerciseType,
  LessonKind,
  MedalTier,
  Prisma,
  PrismaClient,
  SectionKind,
} from '@prisma/client';
import type { SectionContent } from '../lib/lesson-content';

/**
 * Idempotent seed (re-runnable): units/lessons/medals are upserted by their
 * unique slug/key — stale units/lessons (old catalogs) are deleted — and each
 * lesson's exercises + sections are deleted then re-created so order stays
 * stable. Persian here is LESSON CONTENT and lives in the DB (the
 * /lib/i18n/fa.ts dict is only for UI-chrome islands).
 *
 * Seeds: 1 active unit + 4 coming-soon units, 8 lessons (Learn → Story →
 * Practice ×3 → Listening → Build → Test), 50 exercises (incl. the 20-item test
 * pool + 4 listening), 9 sections (8 Learn + 1 Story), 8 medals. Does NOT seed
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

// Present Simple — rebuilt as a staged teaching flow. Stage 1 is the story
// ("At the sports club"): a reading, a scene image, then a two-voice dialogue.
// The earlier learn/practice/test lessons were removed; the seed deletes any
// lesson whose slug is not listed here, so the unit now holds just this one.
// (Later stages re-add the rest.)
const lessons = [
  {
    slug: 'present-simple-story',
    title: 'At the sports club',
    order: 1,
    kind: LessonKind.STORY,
  },
  {
    slug: 'present-simple-usage',
    title: 'Usage',
    order: 2,
    kind: LessonKind.LESSON,
  },
  {
    slug: 'present-simple-structure',
    title: 'Structure',
    order: 3,
    kind: LessonKind.LESSON,
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
    content: {
      url: 'https://youtu.be/nvVdIJ0las0',
      noteFa: 'اگر دوست داری، یک مرورِ ویدیوییِ کوتاهِ این درس را ببین.',
    },
  },
];

// ── Story stage (present-simple-story) — Stage 1 of the rebuilt Present Simple
// flow: a reading (narration), a scene image, then a two-voice dialogue. The
// whole script lives on one section's content.story (no extra SectionKind, so no
// migration). **double-asterisk** spans highlight the present-simple verbs. The
// player reads each line aloud with browser TTS at a slower learner rate and two
// related voices: Tom the coach = tone a (low pitch, left side), Ben the boy =
// tone b (high pitch, right side); narration = narrator. Step 0 is a line so the
// first paint has no client-shuffled question. No comprehension checks yet —
// stage 1 ends after the closing narration. ──
const storySection: SectionSeed = {
  order: 1,
  kind: SectionKind.READING,
  titleEn: 'At the sports club',
  titleFa: '',
  content: {
    story: {
      titleEn: 'At the sports club',
      titleFa: '',
      steps: [
        // Reading — two paragraphs of narration (present simple in context).
        {
          kind: 'line',
          tone: 'narrator',
          en: "Tom **works** at a sports club. He usually **gets up** at 6:00 a.m. and **goes** to work by bus. He **likes** his job because he **loves** sports. He **doesn't drink** coffee, but he **drinks** tea every morning.",
        },
        {
          kind: 'line',
          tone: 'narrator',
          en: 'Tom **knows** many students at the club. He often **watches** their games and **helps** them learn new skills.',
        },
        // Scene image between the reading and the dialogue.
        {
          kind: 'image',
          src: '/stories/sports-club.png',
          alt: 'A friendly coach crouches and talks with a young player on the field of an indoor sports club.',
        },
        // ── Page 1: the dialogue, shown all at once. Header narration first
        // (plays as part of Listen), then Tom (coach) = tone a, Ben (boy) = tone
        // b. Tom's lines carry recorded male-voice clips; Ben/narration use TTS. ──
        {
          kind: 'line',
          tone: 'narrator',
          page: 1,
          en: 'One afternoon, a new student **comes** to the club.',
        },
        {
          kind: 'line',
          tone: 'a',
          speaker: 'Tom',
          page: 1,
          en: '"Hello! My name **is** Tom. What **is** your name?"',
          audio: '/stories/sports-club/tom-1.mp3',
        },
        {
          kind: 'line',
          tone: 'b',
          speaker: 'Ben',
          page: 1,
          en: '"My name **is** Ben."',
        },
        {
          kind: 'line',
          tone: 'a',
          speaker: 'Tom',
          page: 1,
          en: '"**Do** you **play** football?"',
          audio: '/stories/sports-club/tom-2.mp3',
        },
        {
          kind: 'line',
          tone: 'b',
          speaker: 'Ben',
          page: 1,
          en: '"Yes, I **do**. I **play** football twice a week."',
        },
        {
          kind: 'line',
          tone: 'a',
          speaker: 'Tom',
          page: 1,
          en: '"Great! **Do** you **like** sports?"',
          audio: '/stories/sports-club/tom-3.mp3',
        },
        {
          kind: 'line',
          tone: 'b',
          speaker: 'Ben',
          page: 1,
          en: '"Yes, I **do**. I **love** football, but I **don\'t like** basketball."',
        },
        {
          kind: 'line',
          tone: 'a',
          speaker: 'Tom',
          page: 1,
          en: '"You **are** in the right place. Football practice **starts** at 4:00 p.m. every day."',
          audio: '/stories/sports-club/tom-4.mp3',
        },
        // Closing narration — shown below the dialogue, but silent (no Listen).
        {
          kind: 'line',
          tone: 'narrator',
          page: 1,
          noAudio: true,
          en: 'Ben **looks** happy. He **wants** to join the team and make new friends.',
        },
      ],
    },
  },
};

// ── Usage stage (present-simple-usage) — Stage 2: a single scrollable screen of
// illustrated reference cards (no paging, no checks). Each card pairs a themed
// flat illustration with a green title, a one-line explanation and gold-labelled
// examples; the last two sit under an "Additional Uses" divider. English-only;
// rendered by the dedicated UsageGuide view (not the paged reader). ──
const usageSection: SectionSeed = {
  order: 1,
  kind: SectionKind.READING,
  titleEn: 'Usage',
  titleFa: '',
  content: {
    usage: {
      heading: 'Simple Present: Usage',
      cards: [
        {
          image: '/illustrations/usage/routine.svg',
          title: 'Habits and Routines',
          explanation: 'We use the Simple Present to talk about things we do regularly.',
          examples: [
            'Tom usually gets up at 6:00 a.m.',
            'I brush my teeth every morning.',
            'She goes to school by bus.',
          ],
        },
        {
          image: '/illustrations/usage/facts.svg',
          title: 'Facts and General Truths',
          explanation: 'We use the Simple Present to talk about facts that are always true.',
          examples: ['Water boils at 100°C.', 'The sun rises in the east.', 'Birds fly in the sky.'],
        },
        {
          image: '/illustrations/usage/feelings.svg',
          title: 'States, Feelings, and Opinions',
          explanation:
            'We use the Simple Present to talk about feelings, likes, dislikes, thoughts, and opinions.',
          examples: [
            'He likes his job because he loves sports.',
            "I love football, but I don't like basketball.",
            'They think English is useful.',
          ],
        },
        {
          image: '/illustrations/usage/schedule.svg',
          title: 'Schedules and Timetables',
          explanation: 'We use the Simple Present to talk about fixed schedules and timetables.',
          examples: [
            'Football practice starts at 4:00 p.m. every day.',
            'The train leaves at 8:00 a.m.',
            'Our class starts at 9:00 a.m.',
          ],
        },
        {
          image: '/illustrations/usage/commentary.svg',
          title: 'In narrations or Sports Commentary',
          explanation: 'We sometimes use the Simple Present in sports commentary.',
          examples: [
            'Ben passes the ball, runs past two players, and scores!',
            'Anna opens the door, walks into the room, and sits down.',
          ],
          group: 'additional',
        },
        {
          image: '/illustrations/usage/instructions.svg',
          title: 'Instructions and Directions',
          explanation: 'We often use the Simple Present to give instructions.',
          examples: ['First, you enter your email address.', 'You turn left at the traffic light.'],
          group: 'additional',
        },
      ],
    },
  },
};

// ── Structure stage (present-simple-structure) — Stage 3: a single scrollable
// reference of sentence patterns (affirmative / negative / interrogative), each
// split by person with a colour-coded formula of grammar "bricks" and worked
// examples. English-only; rendered by the dedicated StructureGuide view. In the
// examples <b> marks the verb/auxiliary, <i> a short answer and <u> a long
// answer (both drawn as a braced, labelled span). ──
const structureSection: SectionSeed = {
  order: 1,
  kind: SectionKind.READING,
  titleEn: 'Structure',
  titleFa: '',
  content: {
    structure: {
      heading: 'Simple Present: Structure',
      groups: [
        {
          title: 'Affirmative Sentences',
          polarity: '+',
          blocks: [
            {
              person: 'I / You / We / They',
              formula: [
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: 'V (base form)', kind: 'verb' },
              ],
              examples: [
                'I <b>play</b> football twice a week.',
                'We <b>study</b> English every day.',
                'They <b>live</b> in a small town.',
              ],
            },
            {
              person: 'He / She / It',
              formula: [
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: 'V-s / es', kind: 'verb' },
              ],
              examples: [
                'Tom <b>works</b> at a sports club.',
                'She <b>reads</b> a book every evening.',
                'My father <b>drives</b> to work every day.',
              ],
            },
          ],
        },
        {
          title: 'Negative Sentences',
          polarity: '-',
          blocks: [
            {
              person: 'I / You / We / They',
              formula: [
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: "do not (don't)", kind: 'aux' },
                { text: '+', kind: 'plain' },
                { text: 'V (base form)', kind: 'verb' },
              ],
              examples: [
                "I <b>don't like</b> basketball.",
                "We <b>don't eat</b> fast food every day.",
                "They <b>don't watch</b> TV in the morning.",
              ],
            },
            {
              person: 'He / She / It',
              formula: [
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: "does not (doesn't)", kind: 'aux' },
                { text: '+', kind: 'plain' },
                { text: 'V (base form)', kind: 'verb' },
              ],
              examples: [
                "He <b>doesn't drink</b> coffee.",
                "She <b>doesn't work</b> on Saturdays.",
                "My brother <b>doesn't play</b> tennis.",
              ],
            },
          ],
        },
        {
          title: 'Interrogative Sentences',
          polarity: '?',
          blocks: [
            {
              person: 'I / You / We / They',
              formula: [
                { text: 'Do', kind: 'aux' },
                { text: '+', kind: 'plain' },
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: 'V (base form)', kind: 'verb' },
                { text: '?', kind: 'plain' },
              ],
              examples: [
                '<b>Do</b> you <b>play</b> football? <i>Yes, I do</i>. <u>I play football</u>.',
                "<b>Do</b> they <b>live</b> near here? <i>No, they don't</i>. <u>They don’t live near here</u>.",
                '<b>Do</b> you <b>study</b> English every day? Yes, I do. I study for one hour every evening.',
              ],
            },
            {
              person: 'He / She / It',
              formula: [
                { text: 'Does', kind: 'aux' },
                { text: '+', kind: 'plain' },
                { text: 'S', kind: 'subject' },
                { text: '+', kind: 'plain' },
                { text: 'V (base form)', kind: 'verb' },
                { text: '?', kind: 'plain' },
              ],
              examples: [
                '<b>Does</b> Ben <b>like</b> football? <i>Yes, he does</i>. <u>He likes football</u>.',
                "<b>Does</b> she <b>work</b> at a hospital? <i>No, she doesn't</i>. <u>She doesn't work at a hospital</u>.",
                '<b>Does</b> your brother <b>drive</b> to work? Yes, he does. He drives to work every day.',
              ],
            },
          ],
        },
      ],
    },
  },
};

// Sections by lesson — the Learn stage's teaching sections, the Story stage's
// narrative and the Usage / Structure references. The main loop creates whatever
// a lesson lists here (practice/test/listening lessons have none).
const sectionsByLesson: Record<string, SectionSeed[]> = {
  'present-simple-learn': learnSections,
  'present-simple-story': [storySection],
  'present-simple-usage': [usageSection],
  'present-simple-structure': [structureSection],
};

type ExerciseSeed = {
  order: number;
  type: ExerciseType;
  instructionEn: string;
  instructionFa: string;
  prompt: string; // '' for promptless WORD_BANK builders
  options: string[]; // MCQ choices / bank tokens (incl. distractors); [] for FILL_BLANK
  correctIndex: number | null; // MCQ only (authored correct-first; the runner shuffles)
  answer: string | null; // canonical answer for the typed/builder types
  data: { accept: string[] } | null; // FILL_BLANK extra accepted answers
  explanationFa: string;
  explanationEn: string;
};

function mcqSet(
  instructionEn: string,
  instructionFa: string,
  items: Array<{ prompt: string; options: string[]; explanationFa: string; explanationEn: string }>,
): ExerciseSeed[] {
  return items.map((it, i) => ({
    order: i + 1,
    type: ExerciseType.MCQ,
    instructionEn,
    instructionFa,
    prompt: it.prompt,
    options: it.options,
    correctIndex: 0, // authored with the correct option first
    answer: null,
    data: null,
    explanationFa: it.explanationFa,
    explanationEn: it.explanationEn,
  }));
}

function fillBlankItems(
  startOrder: number,
  items: Array<{
    prompt: string;
    answer: string;
    accept?: string[];
    explanationFa: string;
    explanationEn: string;
  }>,
): ExerciseSeed[] {
  return items.map((it, i) => ({
    order: startOrder + i,
    type: ExerciseType.FILL_BLANK,
    instructionEn: 'Type the correct form of the verb.',
    instructionFa: 'شکلِ درستِ فعل را تایپ کن',
    prompt: it.prompt,
    options: [],
    correctIndex: null,
    answer: it.answer,
    data: it.accept ? { accept: it.accept } : null,
    explanationFa: it.explanationFa,
    explanationEn: it.explanationEn,
  }));
}

function builderItems(
  startOrder: number,
  type: ExerciseType,
  instructionEn: string,
  instructionFa: string,
  items: Array<{
    prompt?: string;
    options: string[];
    answer: string;
    explanationFa: string;
    explanationEn: string;
  }>,
): ExerciseSeed[] {
  return items.map((it, i) => ({
    order: startOrder + i,
    type,
    instructionEn,
    instructionFa,
    prompt: it.prompt ?? '',
    options: it.options,
    correctIndex: null,
    answer: it.answer,
    data: null,
    explanationFa: it.explanationFa,
    explanationEn: it.explanationEn,
  }));
}

// LISTEN items reuse the word-bank mechanic: `sentence` is spoken by the runner
// (browser TTS) and kept hidden until answered; `options` are the tokens to
// arrange, and the answer is the sentence (matched case/punctuation-insensitively).
function listenItems(
  startOrder: number,
  items: Array<{
    sentence: string;
    options: string[];
    explanationFa: string;
    explanationEn: string;
  }>,
): ExerciseSeed[] {
  return items.map((it, i) => ({
    order: startOrder + i,
    type: ExerciseType.LISTEN,
    instructionEn: 'Tap what you hear.',
    instructionFa: 'آنچه می‌شنوی را بساز',
    prompt: it.sentence,
    options: it.options,
    correctIndex: null,
    answer: it.sentence,
    data: null,
    explanationFa: it.explanationFa,
    explanationEn: it.explanationEn,
  }));
}

const exercisesByLesson: Record<string, ExerciseSeed[]> = {
  'present-simple-learn': [],
  'present-simple-story': [],
  'present-simple-usage': [],
  'present-simple-structure': [],
  'present-simple-listening': listenItems(1, [
    {
      sentence: 'She drinks a glass of milk.',
      options: ['She', 'drinks', 'a', 'glass', 'of', 'milk'],
      explanationFa: 'سوم‌شخصِ مفرد: drink → drinks.',
      explanationEn: 'Third-person singular: drink → drinks.',
    },
    {
      sentence: 'They play volleyball after school.',
      options: ['They', 'play', 'volleyball', 'after', 'school'],
      explanationFa: 'با they فعل ساده می‌ماند: play.',
      explanationEn: "With 'they', the verb stays in its base form: play.",
    },
    {
      sentence: 'He doesn’t watch TV.',
      options: ['He', 'doesn’t', 'watch', 'TV'],
      explanationFa: 'منفیِ سوم‌شخص: doesn’t + فعلِ ساده.',
      explanationEn: 'Third-person negative: doesn’t + base verb.',
    },
    {
      sentence: 'Does she like her busy life?',
      options: ['Does', 'she', 'like', 'her', 'busy', 'life'],
      explanationFa: 'سؤالِ سوم‌شخص با Does ساخته می‌شود.',
      explanationEn: "Third-person questions start with 'Does'.",
    },
  ]),
  'present-simple-practice-1': mcqSet('Choose the correct answer.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: 'Maryam ___ in Shiraz.',
      options: ['lives', 'live', 'is living', 'lived'],
      explanationFa: 'سوم‌شخصِ مفرد در حالِ ساده s می‌گیرد.',
      explanationEn: 'Third-person singular adds -s in the present simple.',
    },
    {
      prompt: 'She ___ a big breakfast.',
      options: ['doesn’t eat', 'don’t eat', 'not eats', 'doesn’t eats'],
      explanationFa: 'منفیِ سوم‌شخص: doesn’t + فعلِ ساده.',
      explanationEn: 'Third-person negative: doesn’t + base verb.',
    },
    {
      prompt: 'Maryam and her friends ___ volleyball after school.',
      options: ['play', 'plays', 'is playing', 'played'],
      explanationFa: 'فاعلِ جمع → فعل بدونِ s.',
      explanationEn: 'Plural subject → verb with no -s.',
    },
    {
      prompt: '___ Maryam like her busy life? — Yes, she does.',
      options: ['Does', 'Do', 'Is', 'Has'],
      explanationFa: 'سؤالِ سوم‌شخص با Does ساخته می‌شود.',
      explanationEn: 'Third-person questions are formed with Does.',
    },
    {
      prompt: 'Ali ___ TV; he plays video games.',
      options: ['doesn’t watch', 'don’t watch', 'doesn’t watches', 'isn’t watch'],
      explanationFa: 'بعد از doesn’t فعلِ ساده می‌آید.',
      explanationEn: 'After doesn’t, use the base verb.',
    },
    {
      prompt: 'School ___ at eight.',
      options: ['starts', 'start', 'is start', 'starting'],
      explanationFa: 'برنامهٔ ثابت → حالِ ساده با s.',
      explanationEn: 'A fixed schedule → present simple with -s.',
    },
  ]),
  'present-simple-practice-2': mcqSet('Choose the correct form.', 'شکلِ درست را انتخاب کن', [
    {
      prompt: 'He ___ to work by car.',
      options: ['goes', 'go', 'gos', 'going'],
      explanationFa: 'go → goes.',
      explanationEn: 'go ends in -o → goes.',
    },
    {
      prompt: 'She ___ English every day.',
      options: ['studies', 'studys', 'study', 'studying'],
      explanationFa: 'حرفِ بی‌صدا + y → ies.',
      explanationEn: 'Consonant + y → -ies (study → studies).',
    },
    {
      prompt: 'My father ___ TV in the evening.',
      options: ['watches', 'watchs', 'watch', 'watching'],
      explanationFa: 'watch → watches.',
      explanationEn: 'watch ends in -ch → watches.',
    },
    {
      prompt: 'I ___ coffee. I prefer tea.',
      options: ['don’t drink', 'doesn’t drink', 'not drink', 'don’t drinks'],
      explanationFa: 'اول‌شخص → don’t + فعلِ ساده.',
      explanationEn: 'First person → don’t + base verb.',
    },
    {
      prompt: 'The sun ___ in the east.',
      options: ['rises', 'rise', 'rising', 'is rise'],
      explanationFa: 'حقیقتِ کلی → حالِ ساده.',
      explanationEn: 'A general truth → present simple.',
    },
    {
      prompt: 'We ___ in Tehran.',
      options: ['live', 'lives', 'living', 'are live'],
      explanationFa: 'با we فعل بدونِ s می‌آید.',
      explanationEn: 'With we, the verb takes no -s.',
    },
  ]),
  'present-simple-practice-3': mcqSet('Pick the correct option.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: '___ you speak English? — Yes, I do.',
      options: ['Do', 'Does', 'Are', 'Is'],
      explanationFa: 'با you سؤال با Do ساخته می‌شود.',
      explanationEn: 'With you, form questions with Do.',
    },
    {
      prompt: '___ your sister play volleyball?',
      options: ['Does', 'Do', 'Is', 'Has'],
      explanationFa: 'سوم‌شخصِ مفرد → Does.',
      explanationEn: 'Third-person singular → Does.',
    },
    {
      prompt: 'They ___ on Sundays.',
      options: ['don’t work', 'doesn’t work', 'not work', 'don’t works'],
      explanationFa: 'فاعلِ جمع → don’t + فعلِ ساده.',
      explanationEn: 'Plural subject → don’t + base verb.',
    },
    {
      prompt: 'Does he like football? — No, he ___.',
      options: ['doesn’t', 'don’t', 'isn’t', 'not'],
      explanationFa: 'جوابِ کوتاهِ منفی: No, he doesn’t.',
      explanationEn: 'Negative short answer: No, he doesn’t.',
    },
    {
      prompt: 'Where ___ she live?',
      options: ['does', 'do', 'is', 'are'],
      explanationFa: 'سؤالِ Wh با does برای سوم‌شخص.',
      explanationEn: 'Wh- questions use does for the third person.',
    },
    {
      prompt: 'He doesn’t ___ TV at night.',
      options: ['watch', 'watches', 'watching', 'watched'],
      explanationFa: 'بعد از doesn’t فعلِ ساده.',
      explanationEn: 'After doesn’t, use the base verb.',
    },
  ]),
  'present-simple-practice-4': [
    ...fillBlankItems(1, [
      {
        prompt: 'She ___ (go) to school by bus.',
        answer: 'goes',
        explanationFa: 'go با -o تمام می‌شود → goes.',
        explanationEn: 'go ends in -o → goes.',
      },
      {
        prompt: 'My parents ___ (not / like) loud music.',
        answer: 'don’t like',
        accept: ['do not like'],
        explanationFa: 'فاعلِ جمع → don’t + فعلِ ساده.',
        explanationEn: 'Plural subject → don’t + base verb.',
      },
      {
        prompt: 'He ___ (study) English every night.',
        answer: 'studies',
        explanationFa: 'حرفِ بی‌صدا + y → ies.',
        explanationEn: 'Consonant + y → -ies (study → studies).',
      },
    ]),
    ...builderItems(4, ExerciseType.WORD_BANK, 'Build the sentence.', 'جمله را بساز', [
      {
        options: ['She', 'drinks', 'tea', 'every', 'morning', 'drink'],
        answer: 'She drinks tea every morning',
        explanationFa: 'سوم‌شخصِ مفرد s می‌گیرد: drinks.',
        explanationEn: 'Third-person singular adds -s: drinks.',
      },
      {
        options: ['Does', 'he', 'like', 'football', 'Do', 'likes'],
        answer: 'Does he like football',
        explanationFa: 'سؤالِ سوم‌شخص: Does + فعلِ ساده.',
        explanationEn: 'Third-person question: Does + base verb.',
      },
      {
        options: ['They', 'don’t', 'watch', 'TV', 'at', 'night', 'doesn’t'],
        answer: 'They don’t watch TV at night',
        explanationFa: 'فاعلِ جمع → don’t.',
        explanationEn: 'Plural subject → don’t.',
      },
    ]),
    ...builderItems(7, ExerciseType.TRANSLATE, 'Translate into English.', 'به انگلیسی ترجمه کن', [
      {
        prompt: 'او هر روز انگلیسی می‌خوانَد.',
        options: ['She', 'studies', 'English', 'every', 'day', 'study', 'days'],
        answer: 'She studies English every day',
        explanationFa: 'عادتِ روزانه → حالِ ساده با s.',
        explanationEn: 'A daily habit → present simple with -s.',
      },
      {
        prompt: 'من قهوه دوست ندارم.',
        options: ['I', 'don’t', 'like', 'coffee', 'doesn’t', 'likes'],
        answer: 'I don’t like coffee',
        explanationFa: 'اول‌شخص → don’t + فعلِ ساده.',
        explanationEn: 'First person → don’t + base verb.',
      },
    ]),
  ],
  // Checkpoint pool — TEST_SAMPLE_SIZE questions are sampled per attempt.
  'present-simple-test': mcqSet('Choose the correct answer.', 'گزینهٔ درست را انتخاب کن', [
    {
      prompt: 'Sara ___ up at 6 every day.',
      options: ['wakes', 'wake', 'is waking', 'woke'],
      explanationFa: 'عادتِ روزانه → حالِ ساده با s.',
      explanationEn: 'A daily habit → present simple with -s.',
    },
    {
      prompt: 'I ___ like cold weather.',
      options: ['don’t', 'doesn’t', 'am not', 'not'],
      explanationFa: 'اول‌شخص → don’t.',
      explanationEn: 'First person → don’t.',
    },
    {
      prompt: '___ they live near you? — Yes, they do.',
      options: ['Do', 'Does', 'Are', 'Is'],
      explanationFa: 'با they سؤال با Do.',
      explanationEn: 'With they, ask with Do.',
    },
    {
      prompt: 'My brother ___ his homework after dinner.',
      options: ['does', 'do', 'doing', 'is do'],
      explanationFa: 'سوم‌شخص → does.',
      explanationEn: 'Third person → does.',
    },
    {
      prompt: 'Water ___ at 100 degrees.',
      options: ['boils', 'boil', 'is boiling', 'boiled'],
      explanationFa: 'حقیقتِ کلی → حالِ ساده.',
      explanationEn: 'A general truth → present simple.',
    },
    {
      prompt: 'She ___ to music on the bus.',
      options: ['listens', 'listen', 'listening', 'is listen'],
      explanationFa: 'سوم‌شخص s می‌گیرد.',
      explanationEn: 'Third person takes -s.',
    },
    {
      prompt: 'We ___ TV on school nights.',
      options: ['don’t watch', 'doesn’t watch', 'don’t watches', 'not watch'],
      explanationFa: 'جمع → don’t + فعلِ ساده.',
      explanationEn: 'Plural → don’t + base verb.',
    },
    {
      prompt: 'What time ___ the film start?',
      options: ['does', 'do', 'is', 'will'],
      explanationFa: 'سؤالِ Wh دربارهٔ برنامهٔ ثابت → does.',
      explanationEn: 'Wh- question about a fixed schedule → does.',
    },
    {
      prompt: 'Does Maryam read before bed? — Yes, she ___.',
      options: ['does', 'do', 'is', 'reads'],
      explanationFa: 'جوابِ کوتاه: Yes, she does.',
      explanationEn: 'Short answer: Yes, she does.',
    },
    {
      prompt: 'He usually ___ tea, but today he is drinking coffee.',
      options: ['drinks', 'drink', 'is drinking', 'drank'],
      explanationFa: 'عادت → حالِ ساده؛ «امروز» استثناست.',
      explanationEn: 'Habit → present simple; “today” is the exception.',
    },
    {
      prompt:
        'Our new apartment is awful. The heater doesn’t work, the sink leaks, and the refrigerator ___ a loud noise every time it comes on.',
      options: ['makes', 'will make', 'has made', 'made'],
      explanationFa: 'اتفاقِ تکراری (هر بار که روشن می‌شود) → حالِ ساده با s.',
      explanationEn: 'A repeated event (every time it turns on) → present simple with -s.',
    },
    {
      prompt:
        'According to recent advertisements, the new program ___ a dictionary and a spell checker.',
      options: ['includes', 'include', 'is including', 'including'],
      explanationFa: 'ویژگیِ ثابتِ محصول → حالِ ساده؛ سوم‌شخص s می‌گیرد.',
      explanationEn: 'A fixed feature of the product → present simple; third person adds -s.',
    },
    {
      prompt: 'Mr. Lee often ___ his car to work in the morning.',
      options: ['drives', 'drive', 'is driving', 'driving'],
      explanationFa: 'قیدِ تکرارِ often + سوم‌شخص → drives.',
      explanationEn: 'Frequency adverb often + third person → drives.',
    },
    {
      prompt: '“Do they ever go on a picnic at the weekends?” “No, they ___ go on a picnic.”',
      options: ['hardly ever', 'sometimes', 'usually', 'always'],
      explanationFa: 'جوابِ منفی: hardly ever یعنی تقریباً هیچ‌وقت.',
      explanationEn: 'Negative answer: hardly ever means almost never.',
    },
    {
      prompt: '“Do you clean up your room every day?” “No. My mom says my room is ___ untidy.”',
      options: ['always', 'hardly', 'seldom', 'never'],
      explanationFa: 'هر روز تمیز نمی‌کند → اتاق همیشه نامرتب است: always.',
      explanationEn: 'Doesn’t clean it daily → the room is always untidy: always.',
    },
    {
      prompt: 'My little brother always ___ me when I study my lessons.',
      options: ['bothers', 'bothering', 'bothered', 'bother'],
      explanationFa: 'قیدِ تکرار قبل از فعلِ اصلی، و فعل s می‌گیرد: always bothers.',
      explanationEn:
        'Frequency adverb before the main verb, and the verb takes -s: always bothers.',
    },
    {
      prompt: '“Does she ever talk on the phone?” “Yes, ___.”',
      options: ['she usually does', 'she does usually', 'usually she does', 'does she usually'],
      explanationFa: 'در جوابِ کوتاه، قیدِ تکرار قبل از does می‌آید: she usually does.',
      explanationEn: 'In a short answer the frequency adverb comes before does: she usually does.',
    },
    {
      prompt: 'My brother is very lazy. He ___ helps our parents.',
      options: ['never', 'ever', 'often', 'always'],
      explanationFa: 'تنبل است → هیچ‌وقت کمک نمی‌کند: never. (ever در جملهٔ مثبت به‌کار نمی‌رود.)',
      explanationEn: 'He’s lazy → he never helps: never. (ever isn’t used in positive statements.)',
    },
    {
      prompt: 'Does she ever ___ her mom around the house?',
      options: ['help', 'helps', 'helping', 'helped'],
      explanationFa: 'بعد از Does فعلِ ساده می‌آید: help.',
      explanationEn: 'After Does, use the base verb: help.',
    },
    {
      prompt: 'Tom is a vegetarian, so he ___ meat.',
      options: ['doesn’t eat', 'don’t eat', 'doesn’t eats', 'isn’t eat'],
      explanationFa: 'گیاه‌خوار است → doesn’t + فعلِ ساده.',
      explanationEn: 'He’s a vegetarian → doesn’t + base verb.',
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

  // Ladder edits move lessons (e.g. the test shifted to make room for new
  // practice sets) — bump surviving rows out of the way first so the
  // @@unique([unitId, order]) slots are free for the upserts below.
  await prisma.lesson.updateMany({
    where: { unitId: presentSimple.id },
    data: { order: { increment: 1000 } },
  });

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
        type: e.type,
        instructionEn: e.instructionEn,
        instructionFa: e.instructionFa,
        prompt: e.prompt,
        options: e.options,
        correctIndex: e.correctIndex,
        answer: e.answer,
        data: e.data ? (e.data as Prisma.InputJsonValue) : Prisma.DbNull,
        explanationFa: e.explanationFa,
        explanationEn: e.explanationEn,
      })),
    });

    // Same wholesale-replace pattern for the section-backed stages (Learn +
    // Story); practice/listening/test lessons list none and just get cleared.
    await prisma.lessonSection.deleteMany({ where: { lessonId: lesson.id } });
    const sections = sectionsByLesson[l.slug] ?? [];
    if (sections.length > 0) {
      await prisma.lessonSection.createMany({
        data: sections.map((s) => ({
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
