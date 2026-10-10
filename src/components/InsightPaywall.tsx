import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Lock, Sparkles, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAppT } from '../i18n';

type PaywallStatus = {
  enabled: boolean;
  required: boolean;
  hasAccess: boolean;
  exempt?: boolean;
  amount: number;
  amountKobo: number;
  durationDays: number;
  currency: string;
  configured: boolean;
  expiresAt: string | null;
};

type Props = {
  user: any;
  isFounder: boolean;
  children: ReactNode;
};

const naira = (value: number) =>
  `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export default function InsightPaywall({ user, isFounder, children }: Props) {
  const T = useAppT();
  const userId = user?.uid || '';
  const email = user?.email || '';
  const name = user?.displayName || '';

  const [status, setStatus] = useState<PaywallStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justPaid, setJustPaid] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!userId) return null;
    try {
      const url = `${API_ENDPOINTS.paywallStatus}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('status');
      const data = (await res.json()) as PaywallStatus;
      setStatus(data);
      return data;
    } catch {
      // Never lock a merchant out of their own on-device data if the paywall
      // service is unreachable — fail open.
      setStatus((prev) => prev || {
        enabled: false,
        required: false,
        hasAccess: true,
        amount: 0,
        amountKobo: 0,
        durationDays: 30,
        currency: 'NGN',
        configured: false,
        expiresAt: null,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  // Handle Paystack redirect back to the app (?reference=... / ?trxref=...).
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference') || params.get('trxref');
      if (reference) {
        setBusy(true);
        try {
          const res = await fetch(API_ENDPOINTS.paywallVerify(reference));
          const data = await res.json();
          if (mounted && data?.success) setJustPaid(true);
        } catch {}
        // Clean the URL so a refresh doesn't re-trigger verification.
        params.delete('reference');
        params.delete('trxref');
        const qs = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
        setBusy(false);
      }
      if (mounted) await fetchStatus();
    };
    run();
    return () => {
      mounted = false;
    };
  }, [fetchStatus]);

  const startPayment = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.paywallInitialize, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          name,
          callbackUrl: window.location.origin + window.location.pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.authorizationUrl) {
        throw new Error(data?.error || 'Could not start payment. Please try again.');
      }
      window.location.href = data.authorizationUrl;
    } catch (e: any) {
      setError(e?.message || 'Could not start payment. Please try again.');
      setBusy(false);
    }
  };

  const expiryLabel = useMemo(() => {
    if (!status?.expiresAt) return '';
    try {
      return new Date(status.expiresAt).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [status]);

  if (!userId || isFounder) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-bold">{T('paywall.checking')}</p>
      </div>
    );
  }
  if (!status || !status.required || status.hasAccess) return <>{children}</>;

  return (
    <div className="px-3 sm:px-5 xl:px-8 py-2 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#F5C518]/15 border border-[#F5C518]/40 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-[#F5C518]" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {T('paywall.title')}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{T('paywall.subtitle')}</p>
        </div>

        <div className="rounded-xl bg-surface/40 border border-border/60 p-4 space-y-1">
          <p className="text-2xl font-black text-foreground">{naira(status.amount)}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {T('paywall.perPeriod').replace('{0}', String(status.durationDays))}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-rose-300">{error}</p>
          </div>
        )}

        <ul className="text-left space-y-2">
          {[T('paywall.b1'), T('paywall.b2'), T('paywall.b3')].map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={startPayment}
          disabled={busy || !status.configured}
          className="w-full py-3.5 rounded-xl bg-[#F5C518] text-black font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {busy ? T('paywall.starting') : T('paywall.unlock')}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{T('paywall.secure')}</span>
        </div>
      </div>

      {justPaid && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          {T('paywall.activated').replace('{0}', expiryLabel)}
        </div>
      )}

      {!status.configured && (
        <p className="mt-4 text-center text-[11px] font-semibold text-amber-400 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {T('paywall.notConfigured')}
        </p>
      )}
    </div>
  );
}
