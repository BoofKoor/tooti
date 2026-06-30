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
const RESOLVE_TIMEOUT = 1500; // give voices this long to populate before giving up

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ??
    voices[0] ??
    null
  );
}

/** A second, distinct English voice for two-speaker stories — a different voice
 *  if the platform has one, otherwise the primary (callers also vary pitch, so
 *  the two speakers still read apart even with a single installed voice). */
function pickSecondVoice(
  voices: SpeechSynthesisVoice[],
  primary: SpeechSynthesisVoice | null,
): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  return english.find((v) => v.voiceURI !== primary?.voiceURI) ?? primary;
}

/** Per-utterance shaping: a slower learner rate, an explicit rate, a pitch
 *  (low = the man, high = the boy), and `alt` to pick the second voice. */
export type SpeakOptions = { slow?: boolean; rate?: number; pitch?: number; alt?: boolean };

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
    let settled = false;
    const resolve = () => {
      const vs = synth.getVoices();
      if (vs.length) {
        setVoices(vs);
        if (!settled) {
          settled = true;
          setStatus('ready');
        }
      }
    };
    resolve();
    synth.addEventListener('voiceschanged', resolve);
    // Some browsers populate voices late (or never, headless); fall back rather
    // than hang in `pending` forever.
    const timer = window.setTimeout(() => {
      if (settled) return;
      const vs = synth.getVoices();
      setVoices(vs);
      setStatus(vs.length ? 'ready' : 'unsupported');
      settled = true;
    }, RESOLVE_TIMEOUT);
    return () => {
      synth.removeEventListener('voiceschanged', resolve);
      window.clearTimeout(timer);
      synth.cancel();
    };
  }, []);

  const voice = useMemo(() => pickEnglishVoice(voices), [voices]);
  const altVoice = useMemo(() => pickSecondVoice(voices, voice), [voices, voice]);

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel(); // restart cleanly on every tap (and de-dupe React strict re-fires)
      const utterance = new SpeechSynthesisUtterance(text);
      const v = opts?.alt ? altVoice : voice;
      utterance.lang = v?.lang ?? 'en-US';
      if (v) utterance.voice = v;
      utterance.rate = opts?.rate ?? (opts?.slow ? SLOW_RATE : NORMAL_RATE);
      if (opts?.pitch != null) utterance.pitch = opts.pitch;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    },
    [voice, altVoice],
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
