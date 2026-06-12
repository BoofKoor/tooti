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
};
