import type { LanguageCode } from '../i18n';
import type { TtsProvider } from './types';

const PREFERRED_LOCALE: Record<LanguageCode, string> = {
  en: 'en-NG',
  pidgin: 'en-NG',
  igbo: 'ig-NG',
  yoruba: 'yo-NG',
  hausa: 'ha-NG',
};

/** Device voices reliably read English and English-based Pidgin only. */
const SUPPORTED: ReadonlySet<LanguageCode> = new Set<LanguageCode>(['en', 'pidgin']);

let voices: SpeechSynthesisVoice[] = [];
let speakToken = 0;

function refreshVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices() || [];
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const lower = locale.toLowerCase();
  return (
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lower)) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().includes('en'))
  );
}

export const deviceVoice: TtsProvider = {
  id: 'device',

  supports(lang) {
    return SUPPORTED.has(lang);
  },

  preload() {
    refreshVoices();
  },

  cancel() {
    speakToken++;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  },

  speak(text, lang) {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('speechSynthesis unavailable'));
        return;
      }
      const synth = window.speechSynthesis;
      if (!synth) {
        reject(new Error('speechSynthesis unavailable'));
        return;
      }
      const my = ++speakToken;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const locale = PREFERRED_LOCALE[lang] || 'en';
      const match = pickVoice(locale);
      if (match) {
        utterance.voice = match;
        utterance.lang = match.lang;
      } else {
        utterance.lang = locale;
      }
      utterance.rate = 0.92;
      utterance.pitch = 1;

      let settled = false;
      utterance.onend = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      utterance.onerror = () => {
        if (settled) return;
        settled = true;
        reject(new Error('speech synthesis error'));
      };

      // Defer speak() to the next task. Calling speak() in the same tick as
      // cancel() makes Chrome/Edge silently drop the utterance — which is
      // exactly the "no sound" symptom we hit after introducing the provider
      // chain (it cancelled, then spoke immediately).
      window.setTimeout(() => {
        if (my !== speakToken) {
          if (settled) return;
          settled = true;
          reject(new Error('speech cancelled'));
          return;
        }
        synth.speak(utterance);
      }, 0);
    });
  },
};
