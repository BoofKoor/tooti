/**
 * The runner's question contract — a discriminated union over the authored
 * ExerciseTypes (LISTEN is a later phase). Shared by the server wrapper
 * (mapping/sampling) and the client runner, so it must stay free of 'use
 * client' and server-only imports.
 */
export type Question =
  | {
      type: 'MCQ';
      instructionEn: string;
      instructionFa: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanationFa: string;
      explanationEn: string;
    }
  | {
      type: 'FILL_BLANK';
      instructionEn: string;
      instructionFa: string;
      prompt: string;
      answer: string;
      accept: string[];
      explanationFa: string;
      explanationEn: string;
    }
  | {
      type: 'WORD_BANK' | 'TRANSLATE';
      instructionEn: string;
      instructionFa: string;
      prompt: string;
      options: string[];
      answer: string;
      explanationFa: string;
      explanationEn: string;
    };

/** Tile count a question needs a shuffled display order for (0 = typed answer). */
export function optionCount(q: Question): number {
  return 'options' in q ? q.options.length : 0;
}
