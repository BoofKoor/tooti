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

  const speak = useCallback(
    (text: string, opts?: { slow?: boolean }) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel(); // restart cleanly on every tap (and de-dupe React strict re-fires)
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang ?? 'en-US';
      if (voice) utterance.voice = voice;
      utterance.rate = opts?.slow ? SLOW_RATE : NORMAL_RATE;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    },
    [voice],
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
