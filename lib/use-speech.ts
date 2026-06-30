'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Browser Text-to-Speech (Web Speech API) for the listening exercises and the
 * Story player — no audio assets, no network: English is synthesized on the
 * client. An English voice is preferred for quality; if none is present we still
 * speak with the platform default at `lang="en-US"`.
 *
 * `status` is a tri-state so callers never leak content during the resolve
 * window: it starts `pending` (SSR + the brief async voice-load), becomes
 * `ready` once a voice exists, or `unsupported` on browsers/devices with no
 * speech support at all. The listening exercise keeps the sentence hidden until
 * `ready`, and only falls back to showing the text when `unsupported`.
 */
export type SpeechStatus = 'pending' | 'ready' | 'unsupported';

const SLOW_RATE = 0.6;
const NORMAL_RATE = 0.95;
const RESOLVE_TIMEOUT = 3000; // give voices this long to populate before giving up

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ??
    voices[0] ??
    null
  );
}

// Voice-name heuristics — the Web Speech API exposes no gender, so match the
// common platform voice names (Windows / macOS / iOS / Android / Chrome). Kept
// broad so the man actually lands on a male voice instead of a pitched-down
// female one ("a deep woman").
const MALE_RE =
  /\b(male|man|boy|david|mark|guy|christopher|roger|eric|steffan|james|john|aaron|arthur|albert|daniel|fred|gordon|lee|oliver|reed|rishi|rocko|ralph|junior|alex|bruce|thomas|george)\b/i;
const FEMALE_RE =
  /\b(female|woman|girl|samantha|karen|moira|tessa|victoria|susan|hazel|fiona|serena|allison|ava|joanna|salli|kendra|nicky|sandy|martha|catherine|zoe|zira|linda)\b/i;

function pickGenderedVoice(
  voices: SpeechSynthesisVoice[],
  gender: 'male' | 'female',
): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const re = gender === 'male' ? MALE_RE : FEMALE_RE;
  // Positive name match only — a null result lets the caller fall back to a
  // *distinct* voice rather than mislabel a neutral/other-gender one.
  return english.find((v) => re.test(v.name) || re.test(v.voiceURI)) ?? null;
}

/** Per-utterance shaping. `character` selects a voice (the man's deeper voice,
 *  the boy on a lighter voice we pitch up, or the neutral narrator); pitch/rate
 *  fine-tune it; the two speakers stay distinct even on a one-voice device. */
export type SpeakCharacter = 'man' | 'boy' | 'narrator';
export type SpeakOptions = {
  slow?: boolean;
  rate?: number;
  pitch?: number;
  character?: SpeakCharacter;
  // Fires when this utterance finishes (or errors) — lets callers chain a queue.
  onEnd?: () => void;
};

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState<SpeechStatus>('pending');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('unsupported');
      return;
    }
    const synth = window.speechSynthesis;
    // Voices populate synchronously, via `voiceschanged`, or only after a delay
    // (mobile / in-app browsers). Promote to `ready` whenever any arrive and
    // never latch `unsupported`, so late voices can't leave the player mute.
    const resolve = () => {
      const vs = synth.getVoices();
      if (vs.length) {
        setVoices(vs);
        setStatus('ready');
      }
    };
    resolve();
    synth.addEventListener('voiceschanged', resolve);
    // Only call it unsupported if nothing has shown up by the deadline.
    const timer = window.setTimeout(() => {
      if (!synth.getVoices().length) setStatus('unsupported');
    }, RESOLVE_TIMEOUT);

    // Autoplay policy: the first speak() must follow a user gesture or it is
    // dropped silently (this is why the story read nothing). Prime the engine on
    // the first interaction so the auto-spoken lines that follow actually play.
    const unlock = () => {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        synth.speak(u);
        synth.resume();
      } catch {
        /* best-effort */
      }
      detach();
    };
    const detach = () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);

    return () => {
      synth.removeEventListener('voiceschanged', resolve);
      window.clearTimeout(timer);
      detach();
      synth.cancel();
    };
  }, []);

  const englishVoices = useMemo(
    () => voices.filter((v) => v.lang?.toLowerCase().startsWith('en')),
    [voices],
  );
  const primaryVoice = useMemo(() => pickEnglishVoice(voices), [voices]);
  const maleVoice = useMemo(() => pickGenderedVoice(voices, 'male'), [voices]);
  const femaleVoice = useMemo(() => pickGenderedVoice(voices, 'female'), [voices]);
  // The boy reads on a light/female voice we pitch up (locked — it sounds right).
  const boyVoice = useMemo(() => femaleVoice ?? primaryVoice, [femaleVoice, primaryVoice]);
  // The man prefers a real male voice; if the device has none, take ANY voice
  // that isn't the boy's so the two still read as different people (rather than
  // the same voice pitched down into "a deep woman").
  const manVoice = useMemo(
    () => maleVoice ?? englishVoices.find((v) => v.voiceURI !== boyVoice?.voiceURI) ?? primaryVoice,
    [maleVoice, englishVoices, boyVoice, primaryVoice],
  );

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel(); // restart cleanly on every tap (and de-dupe React strict re-fires)
      const utterance = new SpeechSynthesisUtterance(text);
      const v =
        opts?.character === 'man' ? manVoice : opts?.character === 'boy' ? boyVoice : primaryVoice;
      utterance.lang = v?.lang ?? 'en-US';
      if (v) utterance.voice = v;
      utterance.rate = opts?.rate ?? (opts?.slow ? SLOW_RATE : NORMAL_RATE);
      if (opts?.pitch != null) utterance.pitch = opts.pitch;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        opts?.onEnd?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        opts?.onEnd?.();
      };
      synth.speak(utterance);
    },
    [primaryVoice, manVoice, boyVoice],
  );

  // Stop any in-flight speech — callers invoke this when leaving an item so audio
  // doesn't bleed into the next question (e.g. skipping a LISTEN mid-sentence).
  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { status, speaking, speak, cancel };
}
