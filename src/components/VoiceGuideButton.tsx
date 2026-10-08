import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  isVoiceGuideEnabled,
  setVoiceGuideEnabled,
  subscribeVoiceGuide,
  cancelSpeech,
  readPage,
  type GuidePage,
} from '../voiceGuide';
import { useAppLang, useAppT } from '../i18n';

interface VoiceGuideButtonProps {
  page: GuidePage;
  onStatusChange?: (enabled: boolean) => void;
}

export const VoiceGuideButton: React.FC<VoiceGuideButtonProps> = ({ page, onStatusChange }) => {
  const lang = useAppLang();
  const T = useAppT();
  const [enabled, setEnabled] = useState(isVoiceGuideEnabled());

  useEffect(() => {
    return subscribeVoiceGuide(() => {
      const next = isVoiceGuideEnabled();
      setEnabled(next);
      onStatusChange?.(next);
    });
  }, [onStatusChange]);

  const handleToggle = () => {
    const next = !enabled;
    setVoiceGuideEnabled(next);
    setEnabled(next);
    onStatusChange?.(next);
    if (next) {
      setTimeout(() => readPage(page, lang), 150);
    } else {
      cancelSpeech();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
        enabled
          ? 'bg-[#F5C518] text-black border-amber-300 shadow-md shadow-amber-500/20'
          : 'bg-surface hover:bg-surface-hover border-border/80 text-muted-foreground hover:text-foreground'
      }`}
      title={enabled ? T('voice.headerOn') : T('voice.headerOff')}
      aria-label="Toggle voice explanation"
    >
      {enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      {enabled && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-card" />}
    </button>
  );
};

export default VoiceGuideButton;