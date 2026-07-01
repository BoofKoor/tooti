/**
 * LessonSection `content` Json shapes — the stable contract between the seed
 * (which writes them) and the Learn-stage UI (Phase 5B renders them). Pure
 * types: no React, no DB.
 */

export type Example = { en: string; fa?: string; note?: string };

/** Hearts-free inline check a section may end with (5B renders it inline). */
export type MicroCheck = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationFa: string;
};

export type SectionContent = {
  // READING: paragraphs of English text; **double-asterisk** spans mark grammar highlights.
  paragraphs?: string[];
  // CONCEPT: Persian-first explanation + examples (from the text and new ones).
  bodyFa?: string; // short Persian explanation (the comprehension-critical island)
  examples?: Example[];
  // SUMMARY: recap rows.
  recap?: { labelFa: string; en: string }[];
  // VIDEO: host-agnostic; null url → 5B hides the section. Click-to-load, never autoplay
  // (YouTube is filtered for much of the audience — graceful fallback link in 5B).
  url?: string | null;
  noteFa?: string;
  // Any section may end with one hearts-free micro-check (5B renders it inline).
  check?: MicroCheck;
  // STORY lessons (LessonKind.STORY) carry their whole interactive narrative here,
  // on a single section, so no new SectionKind / migration is needed. The Story
  // player (/story/[slug]) renders it; the Learn-stage reader never sees it.
  story?: StoryContent;
  // A LESSON whose section carries a `usage` guide renders the scrollable
  // illustrated reference (UsageGuide) instead of the paged reader.
  usage?: UsageGuide;
  // A LESSON whose section carries a `structure` guide renders the sentence-
  // pattern reference (StructureGuide) instead of the paged reader.
  structure?: StructureGuide;
  // A LESSON whose section carries a `notes` guide renders the illustrated
  // "important notes" reference (NotesGuide) instead of the paged reader.
  notes?: NotesGuide;
  // A LESSON whose section carries a `summary` guide renders the end-of-unit
  // recap (SummaryGuide) instead of the paged reader.
  summary?: SummaryGuide;
};

/**
 * End-of-unit recap (e.g. "Present Simple: Summary") — a single scrollable screen
 * of green-titled sections, each holding orange-labelled entries that condense
 * what was taught: a use + example, a person → pattern + example row, a chip row
 * of words, spelling transforms, or a pattern line. English-only.
 */
export type SummaryRow = { person?: string; pattern?: string; example?: string };
export type SummaryEntry = {
  label: string; // orange sub-heading
  pattern?: string; // a single pattern line (e.g. "Don't/Doesn't + S + V?")
  chips?: string[]; // a wrapped row of word tags (adverbs, time expressions)
  transforms?: NoteTransform[]; // spelling "a → b" rows (reuses the Notes shape)
  rows?: SummaryRow[]; // person → pattern + example rows (Structure recap)
  examples?: string[]; // example sentence(s)
};
export type SummarySection = { title: string; image?: string; entries: SummaryEntry[] };
export type SummaryGuide = {
  heading: string;
  image?: string; // optional themed hero illustration under the heading
  sections: SummarySection[];
};

/**
 * "Important Notes" reference (e.g. "Present Simple: Important Notes") — a single
 * scrollable screen of themed sections. Each section is a card with a green title
 * and an ordered list of content blocks (prose, gold-labelled examples, spelling
 * transformations, a pattern/formula, an illustration, or nested numbered rules).
 * English-only. Inline `<b>…</b>` marks a highlighted span in any text/example.
 */
export type NoteTransform = { from: string; to: string }; // `from` may carry <b>
export type NoteBlock =
  | { kind: 'text'; text: string } // a paragraph (supports <b> highlights)
  | { kind: 'examples'; items: string[] } // gold "Examples:" + bullet list
  | { kind: 'transforms'; items: NoteTransform[] } // gold "Examples:" + "a → b" rows
  | { kind: 'formula'; label?: string; text: string } // a labelled pattern box
  | { kind: 'image'; src: string; caption?: string; alt?: string } // themed illustration; alt defaults to decorative
  | { kind: 'steps'; items: NoteStep[] }; // nested numbered sub-rules
export type NoteStep = { title: string; blocks: NoteBlock[] };
export type NoteSection = { title: string; blocks: NoteBlock[] };
export type NotesGuide = {
  heading: string;
  sections: NoteSection[];
};

/**
 * Sentence-structure reference (e.g. "Simple Present: Structure") — affirmative /
 * negative / interrogative groups, each split by person, each showing a colour-
 * coded formula of grammar "bricks" plus worked examples. English-only.
 *
 * Example strings carry light inline markup the renderer expands:
 *   <b>…</b>  → the highlighted verb/auxiliary
 *   <i>…</i>  → a span braced + labelled "Short answer"
 *   <u>…</u>  → a span braced + labelled "Long answer"
 */
export type FormulaToken = {
  text: string;
  // 'plain' renders as a muted connector (+, ?); the rest render as coloured
  // bricks: subject=teal, verb=green, aux=coral (do/does/not), suffix=gold.
  kind: 'subject' | 'verb' | 'aux' | 'suffix' | 'plain';
};
export type StructureBlock = {
  person: string; // e.g. 'I / You / We / They' (shown as a pill)
  formula: FormulaToken[];
  examples: string[]; // authored with <b>/<i>/<u> markup
};
export type StructureGroup = {
  title: string; // rendered green, e.g. 'Affirmative Sentences'
  polarity: '+' | '-' | '?'; // drives the group badge (green / coral / blue)
  blocks: StructureBlock[];
};
export type StructureGuide = {
  heading: string;
  groups: StructureGroup[];
};

/**
 * Illustrated grammar-usage reference (e.g. "Simple Present: Usage") — a single
 * scrollable screen of cards. Each card pairs a themed illustration with a green
 * title, a one-line explanation, and gold-labelled examples. English-only.
 */
export type UsageCard = {
  image: string; // illustration /public path (e.g. '/illustrations/usage/routine.svg')
  title: string; // rendered green
  explanation: string; // one sentence
  examples: string[]; // bullet examples under a gold "Examples:" label
  group?: 'additional'; // cards under the "Additional Uses" divider
};
export type UsageGuide = {
  heading: string;
  cards: UsageCard[];
};

/**
 * Interactive Story (Duolingo-style) — an ordered script of spoken lines and
 * inline comprehension questions. Lines are spoken with browser TTS (no audio
 * assets); the Persian `fa` subtitle is the comprehension-critical island.
 */
export type StoryTone = 'a' | 'b' | 'narrator'; // drives the bubble's side + accent

// `page` groups steps into the screens the player tabs through with Continue
// (e.g. 0 = the reading + image, 1 = the dialogue). Steps without a page are
// page 0. Each page is shown all at once with a single "Listen" button.
export type StoryStep =
  | {
      kind: 'line';
      tone: StoryTone;
      speaker?: string; // shown above the bubble; omitted for narration
      en: string; // spoken aloud; **double-asterisk** spans mark grammar highlights
      fa?: string; // Persian gloss (sanctioned island)
      // Pre-recorded narration (a /public path). When set, the player plays this
      // clip instead of browser TTS — used for voices the device can't produce
      // (e.g. a real male voice). Falls back to TTS when absent.
      audio?: string;
      page?: number;
      // Shown as text but excluded from the page's Listen playback (e.g. the
      // closing narration that the author wants silent).
      noAudio?: boolean;
    }
  | {
      kind: 'image';
      // An illustration revealed between beats (e.g. a scene photo); not spoken.
      src: string; // /public path, e.g. '/stories/sports-club.png'
      alt: string; // accessible description (English)
      fa?: string; // optional Persian caption
      page?: number;
    }
  | {
      kind: 'q';
      // Hearts-free inline check (authored correct-first; the player shuffles).
      prompt: string;
      options: string[];
      correctIndex: number;
      explanationFa: string;
      page?: number;
    };

export type StoryContent = {
  titleEn: string;
  titleFa: string;
  steps: StoryStep[];
};
