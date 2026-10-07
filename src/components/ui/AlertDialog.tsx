import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

export type AlertType = 'danger' | 'warning' | 'info' | 'success';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  isConfirmOnly?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  // Optional text input for prompt replacement
  promptInput?: {
    value: string;
    placeholder?: string;
    onChange: (val: string) => void;
  };
}

export default function AlertDialog({
  isOpen,
  title,
  description,
  type = 'info',
  confirmText = 'Continue',
  cancelText = 'Cancel',
  isConfirmOnly = false,
  onConfirm,
  onCancel,
  promptInput,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const iconConfig = {
    danger: { icon: AlertTriangle, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', btn: 'bg-rose-500 hover:bg-rose-600 text-white' },
    warning: { icon: AlertCircle, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', btn: 'bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold' },
    info: { icon: Info, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', btn: 'bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold' },
    success: { icon: CheckCircle2, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', btn: 'bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold' },
  }[type];

  const IconComponent = iconConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel || onConfirm}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
        >
          {/* Close button if cancelable */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-start gap-4 mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${iconConfig.bg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0 pr-4">
              <h3 className="text-lg font-black text-foreground tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Optional Prompt Input (e.g. for image url) */}
          {promptInput && (
            <div className="my-4">
              <input
                type="text"
                value={promptInput.value}
                placeholder={promptInput.placeholder}
                onChange={(e) => promptInput.onChange(e.target.value)}
                autoFocus
                className="w-full bg-surface border border-border/80 focus:border-[#F5C518] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-border/40">
            {!isConfirmOnly && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-full border border-border/80 hover:bg-surface text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm transition-all ${iconConfig.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
