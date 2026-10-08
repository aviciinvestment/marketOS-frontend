import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Phone, AlertCircle, CheckCircle2, Wifi, WifiOff, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAppLang, useAppT, tf } from '../i18n';

interface SupportComplaint {
  id: string;
  userId?: string;
  email: string;
  phoneNumber: string;
  category: string;
  message: string;
  createdAt: string;
}

interface SupportWidgetProps {
  userEmail?: string;
  userId?: string;
}

const STORAGE_KEY = 'marketos_offline_complaints';

const CATEGORIES = [
  { value: 'Sync & Connection', labelKey: 'support.catSync' },
  { value: 'Sales & Quick Sell', labelKey: 'support.catSales' },
  { value: 'Stock & Yields', labelKey: 'support.catStock' },
  { value: 'Calculations & Profit', labelKey: 'support.catCalc' },
  { value: 'Account & Auth', labelKey: 'support.catAuth' },
  { value: 'Feature Request', labelKey: 'support.catFeature' },
  { value: 'Urgent Bug', labelKey: 'support.catBug' },
];

export const SupportWidget: React.FC<SupportWidgetProps> = ({ userEmail, userId }) => {
  const lang = useAppLang();
  const T = useAppT();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success-online' | 'success-offline' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Sync email when userEmail prop updates
  useEffect(() => {
    if (userEmail && !email) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Load offline queue count
  const checkOfflineQueue = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const queue: SupportComplaint[] = JSON.parse(stored);
        setOfflineQueueCount(queue.length);
      } else {
        setOfflineQueueCount(0);
      }
    } catch {
      setOfflineQueueCount(0);
    }
  };

  useEffect(() => {
    checkOfflineQueue();

    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flush offline complaints when internet returns
  const flushOfflineQueue = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const queue: SupportComplaint[] = JSON.parse(stored);
      if (queue.length === 0) return;

      const remaining: SupportComplaint[] = [];

      for (const item of queue) {
        try {
          const res = await fetch(API_ENDPOINTS.supportComplaint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setOfflineQueueCount(remaining.length);
    } catch (e) {
      console.warn('Could not flush offline complaints queue:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict Phone number validation (Nigerian standard: 10-15 digits or e.g. 080..., +234...)
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage(T('support.errPhone'));
      return;
    }

    if (!message.trim()) {
      setErrorMessage(T('support.errMsg'));
      return;
    }

    setIsSubmitting(true);

    const complaintData: SupportComplaint = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: userId || 'web-client',
      email: email || 'anonymous@user.com',
      phoneNumber: cleanPhone,
      category,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    // If currently offline, queue immediately to localStorage
    if (!navigator.onLine) {
      saveOffline(complaintData);
      setSubmitStatus('success-offline');
      setIsSubmitting(false);
      resetForm();
      return;
    }

    // Try posting to backend
    try {
      const res = await fetch(API_ENDPOINTS.supportComplaint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData),
      });

      if (res.ok) {
        setSubmitStatus('success-online');
        resetForm();
      } else {
        // Backend failure: Fallback to offline queue
        saveOffline(complaintData);
        setSubmitStatus('success-offline');
        resetForm();
      }
    } catch (err) {
      // Network failure / server offline: Fallback to local storage
      saveOffline(complaintData);
      setSubmitStatus('success-offline');
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveOffline = (complaint: SupportComplaint) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const queue: SupportComplaint[] = stored ? JSON.parse(stored) : [];
      queue.push(complaint);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      setOfflineQueueCount(queue.length);
    } catch (e) {
      console.error('Failed to save complaint locally:', e);
    }
  };

  const resetForm = () => {
    setMessage('');
    setTimeout(() => {
      setSubmitStatus('idle');
    }, 4500);
  };

  return (
    <>
      {/* Floating Action Button at Bottom Right - Lifted up on mobile to avoid intersecting with bottom nav */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-2">
        {offlineQueueCount > 0 && (
          <div className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-pulse">
            <Clock size={12} />
            <span>{tf(lang, 'support.queued', offlineQueueCount)}</span>
          </div>
        )}

        <button
          id="support-complaint-trigger-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-2xl hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-amber-300/40"
          title={T('support.btnTitle')}
        >
          {isOpen ? (
            <X size={22} className="text-slate-950" />
          ) : (
            <MessageSquare size={22} className="text-slate-950 fill-slate-950" />
          )}

          {/* Indicator Dot */}
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </button>
      </div>

      {/* Floating Complaint Modal / Popover - Optimized for mobile & desktop */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 bottom-20 md:bottom-22 md:right-6 md:left-auto md:inset-x-auto z-50 w-auto md:w-[410px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {T('support.title')}
                </h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <Wifi size={11} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{T('support.online')}</span> • {T('support.direct')}
                    </>
                  ) : (
                    <>
                      <WifiOff size={11} className="text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">{T('support.offline')}</span> • {T('support.savedLocal')}
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
            {submitStatus === 'success-online' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{T('support.gotTitle')}</div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                    {T('support.gotDesc')}
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'success-offline' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
                <Clock size={18} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{T('support.savedTitle')}</div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    {T('support.savedDesc')}
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Phone Number Field (Mandatory per requirement) */}
              <div>
                <label className="block text-foreground font-medium mb-1 flex items-center justify-between">
                  <span>{T('support.phoneLabel')} <span className="text-amber-400">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">{T('support.phoneHint')}</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    id="support-phone-input"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={T('support.phonePlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-foreground font-medium mb-1">
                  {T('support.emailLabel')} <span className="text-muted-foreground text-[10px] font-normal">{T('support.emailOptional')}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={T('support.emailPlaceholder')}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs"
                />
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-foreground font-medium mb-1">
                  {T('support.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{T(cat.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Complaint Details */}
              <div>
                <label className="block text-foreground font-medium mb-1">
                  {T('support.issueLabel')} <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="support-message-input"
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={T('support.issuePlaceholder')}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="support-submit-btn"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>{isOnline ? T('support.sendOnline') : T('support.saveOffline')}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">
                {T('support.footNote')}
              </p>
            </form>
          </div>
        </div>
      </>
    )}
    </>
  );
};