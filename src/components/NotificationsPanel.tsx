import { useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, PartyPopper, WifiOff, RefreshCw } from 'lucide-react';
import { calculateFinancials, stockOf } from '../utils/finance';
import { getStoredLang, t, tf, useAppLang, useAppT, type LanguageCode } from '../i18n';

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: 'profit' | 'break-even' | 'spending' | 'offline';
  title: string;
  message: string;
  time: string;
}

// Derive the notification list straight from the data, so it is always current.
export function buildNotifications(
  products: any[],
  sales: any[],
  expenses: any[],
  lang: LanguageCode = getStoredLang(),
): AppNotification[] {
  const notes: AppNotification[] = [];
  const now = new Date().toISOString();
  const stamp = Date.now();

  const { totalSales, grossProfit, totalExpenses, netProfit } = calculateFinancials(sales, expenses, products);

  // Profit milestone
  if (totalSales > 0 && netProfit > 0) {
    notes.push({
      id: `profit-${stamp}`,
      type: 'success',
      icon: 'profit',
      title: t(lang, 'notif.makingMoney'),
      message: tf(lang, 'notif.afterCosts', netProfit.toLocaleString()),
      time: now,
    });
  } else if (totalSales > 0 && grossProfit > 0 && netProfit <= 0) {
    notes.push({
      id: `gross-profit-${stamp}`,
      type: 'info',
      icon: 'profit',
      title: t(lang, 'notif.coveringGoods'),
      message: tf(lang, 'notif.costsEating', grossProfit.toLocaleString()),
      time: now,
    });
  }

  // Spending too much
  if (totalSales > 0 && totalExpenses >= totalSales) {
    notes.push({
      id: `spending-${stamp}`,
      type: 'danger',
      icon: 'spending',
      title: t(lang, 'notif.spendingTooMuch'),
      message: tf(lang, 'notif.spendingMatch', totalExpenses.toLocaleString(), totalSales.toLocaleString()),
      time: now,
    });
  } else if (totalExpenses > 0 && totalExpenses >= grossProfit) {
    notes.push({
      id: `spending-profit-${stamp}`,
      type: 'warning',
      icon: 'spending',
      title: t(lang, 'notif.wipingProfit'),
      message: tf(lang, 'notif.watchingSpend', totalExpenses.toLocaleString(), grossProfit.toLocaleString()),
      time: now,
    });
  }

  // Break-even / payback reached per product
  products.forEach(p => {
    const s = stockOf(p, sales);
    if (s.moneyMade > 0 && s.fractionConsumed >= 1) {
      notes.push({
        id: `break-even-${p.id}-${stamp}`,
        type: 'success',
        icon: 'break-even',
        title: tf(lang, 'notif.paidBack', p.name),
        message: tf(lang, 'notif.paidBackMsg', p.name, s.goodsCost.toLocaleString()),
        time: now,
      });
    } else if (s.moneyMade > 0 && s.fractionConsumed >= 0.5 && s.fractionConsumed < 1) {
      notes.push({
        id: `halfway-${p.id}-${stamp}`,
        type: 'info',
        icon: 'break-even',
        title: tf(lang, 'notif.halfway', p.name),
        message: tf(lang, 'notif.halfwayMsg', (s.fractionConsumed * 100).toFixed(0), s.goodsCost.toLocaleString()),
        time: now,
      });
    }
  });

  notes.sort((a, b) => (a.time < b.time ? 1 : -1));
  return notes.slice(0, 8);
}

export default function NotificationsPanel({
  isOpen,
  products,
  sales,
  expenses,
  otherDevicePending,
  onClose,
  onRetrySync,
}: {
  isOpen: boolean;
  products: any[];
  sales: any[];
  expenses: any[];
  otherDevicePending: string[];
  onClose: () => void;
  onRetrySync: () => void;
}) {
  const lang = useAppLang();
  const T = useAppT();
  const notes = useMemo(() => buildNotifications(products, sales, expenses, lang), [products, sales, expenses, lang]);

  const iconFor: Record<AppNotification['icon'], { el: ReactNode; cls: string }> = {
    profit: { el: <TrendingUp className="w-4 h-4" />, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    'break-even': { el: <PartyPopper className="w-4 h-4" />, cls: 'bg-[#F5C518]/15 text-amber-400 border-[#F5C518]/30' },
    spending: { el: <AlertTriangle className="w-4 h-4" />, cls: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
    offline: { el: <WifiOff className="w-4 h-4" />, cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-card border-l border-border/80 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div>
                <h3 className="font-black text-lg text-foreground tracking-tight">{T('notif.title')}</h3>
                <p className="text-[11px] text-muted-foreground font-medium">{T('notif.subtitle')}</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface hover:bg-surface-hover border border-border/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Other device has unsynced data */}
              {otherDevicePending.length > 0 && (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-foreground">{T('notif.anotherDevice')}</div>
                      <div className="text-[11px] text-sky-400 font-medium mt-0.5 leading-relaxed">
                        {otherDevicePending.length > 1
                          ? tf(lang, 'notif.devicesPending', otherDevicePending.length)
                          : T('notif.devicePending')}
                        {' '}{T('notif.goOnline')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onRetrySync}
                    className="mt-3 inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-extrabold transition-colors hover:bg-sky-600"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {T('notif.pullLatest')}
                  </button>
                </div>
              )}

              {notes.length === 0 && otherDevicePending.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface border border-border/70 flex items-center justify-center">
                    <PartyPopper className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold">{T('notif.quiet')}</div>
                  <div className="text-xs mt-1 px-6 leading-relaxed">
                    {T('notif.quietDesc')}
                  </div>
                </div>
              ) : (
                notes.map(note => {
                  const ico = iconFor[note.icon];
                  return (
                    <div key={note.id} className="bg-surface/50 border border-border/50 rounded-2xl p-4 flex gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${ico.cls}`}>
                        {ico.el}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-extrabold text-foreground">{note.title}</div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{note.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}