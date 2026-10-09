import type { LanguageCode } from '../i18n';
import { deviceVoice } from './deviceVoice';

export type { TtsProvider, TtsProviderId } from './types';

/**
 * The voice guide uses the device's built-in speech synthesis only, and only
 * for the languages it reads well: English and (English-based) Pidgin.
 */
export function supportsLanguage(lang: LanguageCode): boolean {
  return deviceVoice.supports(lang);
}

/** Stop any in-flight speech immediately. */
export function cancel(): void {
  deviceVoice.cancel();
}

/** Speak text with the device voice. No-op for unsupported languages. */
export async function speak(text: string, lang: LanguageCode): Promise<void> {
  if (!deviceVoice.supports(lang)) return;
  deviceVoice.cancel();
  try {
    await deviceVoice.speak(text, lang);
  } catch {
    // ignore - device voice unavailable or failed
  }
}
