import type { LanguageCode } from '../i18n';

export type TtsProviderId = 'device';

export interface TtsProvider {
  readonly id: TtsProviderId;
  /** Whether this provider can render the given language. */
  supports(lang: LanguageCode): boolean;
  /**
   * Speak the text. Resolves once playback has finished, or rejects when the
   * provider could not produce/play audio.
   */
  speak(text: string, lang: LanguageCode): Promise<void>;
  /** Stop any in-flight generation or playback immediately. */
  cancel(): void;
  /** Optional best-effort warm-up. */
  preload?(lang: LanguageCode): void;
}
