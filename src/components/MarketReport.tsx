import { useMemo } from 'react';
import { BarChart2, Wallet, TrendingUp, ShoppingBag, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateFinancials, saleRevenue, stockOf } from '../utils/finance';
import { useAppT, useAppLang, tf } from '../i18n';

export type TimePeriodType = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function MarketReport({ 
  sales,
  expenses = [],
  products,
  timePeriod = 'all',
  setTimePeriod,
  customStart = '',
  setCustomStart,
  customEnd = '',
  setCustomEnd
}: { 
  sales: any[]; 
  expenses?: any[]; 
  products: any[];
  timePeriod?: TimePeriodType;
  setTimePeriod: (p: TimePeriodType) => void;
  customStart?: string;
  setCustomStart: (s: string) => void;
  customEnd?: string;
  setCustomEnd: (s: string) => void;
}) {
  const now = new Date();
  const T = useAppT();
  const lang = useAppLang();

  // Same period filter used across the app.
  const filterData = (items: any[], period: string, start?: Date, end?: Date) => {
    return items.filter(item => {
      if (period === 'all') return true;
      const itemDate = new Date(item.timestamp || item.date || Date.now());
      if (isNaN(itemDate.getTime())) return true;

      if (period === 'custom') {
        if (!start || !end) return true;
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        const e = new Date(end); e.setHours(23, 59, 59, 999);
        return itemDate >= s && itemDate <= e;
      }

      const timeDiff = now.getTime() - itemDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (period === 'today') return itemDate.toDateString() === now.toDateString();
      if (period === 'week') return daysDiff <= 7;
      if (period === 'month') return daysDiff <= 30;
      if (period === 'year') return daysDiff <= 365;

      return true;
    });
  };

  const filterPreviousData = (items: any[], period: string, start?: Date, end?: Date) => {
    if (period === 'all') return [];
    return items.filter(item => {
      const itemDate = new Date(item.timestamp || item.date || Date.now());
      if (isNaN(itemDate.getTime())) return false;

      if (period === 'custom') {
        if (!start || !end) return false;
        const duration = new Date(end).getTime() - new Date(start).getTime();
        const prevStart = new Date(new Date(start).getTime() - duration);
        const prevEnd = new Date(new Date(start).getTime() - 1);
        return itemDate >= prevStart && itemDate <= prevEnd;
      }

      const timeDiff = now.getTime() - itemDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (period === 'today') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return itemDate.toDateString() === yesterday.toDateString();
      }
      if (period === 'week') return daysDiff > 7 && daysDiff <= 14;
      if (period === 'month') return daysDiff > 30 && daysDiff <= 60;
      if (period === 'year') return daysDiff > 365 && daysDiff <= 730;

      return false;
    });
  };

  const customStartDate = customStart ? new Date(customStart) : undefined;
  const customEndDate = customEnd ? new Date(customEnd) : undefined;

  const currentSales = useMemo(() => filterData(sales, timePeriod, customStartDate, customEndDate), [sales, timePeriod, customStart, customEnd]);
  const previousSales = useMemo(() => filterPreviousData(sales, timePeriod, customStartDate, customEndDate), [sales, timePeriod, customStart, customEnd]);
  const currentExpenses = useMemo(() => filterData(expenses, timePeriod, customStartDate, customEndDate), [expenses, timePeriod, customStart, customEnd]);

  const fin = useMemo(
    () => calculateFinancials(currentSales, currentExpenses, products),
    [currentSales, currentExpenses, products]
  );
  const prevFin = useMemo(
    () => calculateFinancials(previousSales, [], products),
    [previousSales, products]
  );

  const moneyMade = fin.totalSales;
  const profit = fin.netProfit;
  const moneySpent = fin.totalExpenses;

  // Lifetime stock picture (what's still in the shop, not period-based).
  const stockValue = products.reduce((acc: number, p: any) => {
    const s = stockOf(p, sales.filter((x: any) => x.productId === p.id));
    return acc + s.remainingValue;
  }, 0);
  const stockCount = products.reduce((acc: number, p: any) => {
    const s = stockOf(p, sales.filter((x: any) => x.productId === p.id));
    return acc + s.qtyRemaining;
  }, 0);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Friendly headline.
  let greeting = T('dash.doingWell');
  if (moneyMade === 0) greeting = T('dash.welcome');
  else if (profit > 0) greeting = T('dash.great');
  else if (profit < 0) greeting = T('dash.loss');

  const periodLabel = timePeriod === 'all'
    ? 'All time'
    : timePeriod === 'today'
    ? 'Today'
    : timePeriod === 'custom'
    ? 'Selected custom period'
    : `This ${timePeriod}`;

  // Simple comparison with the previous period.
  let headline: any = null;
  if (currentSales.length === 0 && previousSales.length === 0) {
    headline = <p>{tf(lang, 'narrative.noneYet', periodLabel.toLowerCase())}</p>;
  } else if (previousSales.length === 0 || timePeriod === 'all') {
    headline = <p>{tf(lang, 'narrative.summary', periodLabel.toLowerCase(), profit.toLocaleString(), moneyMade.toLocaleString())}</p>;
  } else {
    const revDiff = moneyMade - prevFin.totalSales;
    const profitDiff = profit - prevFin.netProfit;
    if (revDiff > 0 && profitDiff > 0) {
      headline = <p>{tf(lang, 'narrative.growing', revDiff.toLocaleString(), profitDiff.toLocaleString())}</p>;
    } else if (revDiff > 0 && profitDiff <= 0) {
      headline = <p>{T('narrative.salesUp')}</p>;
    } else if (revDiff < 0 && profitDiff < 0) {
      headline = <p>{tf(lang, 'narrative.down', Math.abs(revDiff).toLocaleString())}</p>;
    } else if (revDiff < 0 && profitDiff >= 0) {
      headline = <p>{T('narrative.fewerBetter')}</p>;
    } else {
      headline = <p>{T('narrative.flat')}</p>;
    }
  }

  // Best sellers by money made this period.
  const byRevenue = products.map(p => {
    const pSales = currentSales.filter(s => s.productId === p.id);
    const rev = pSales.reduce((acc, s) => acc + saleRevenue(s), 0);
    const qty = pSales.reduce((acc, s) => acc + (s.quantitySold || 0), 0);
    return { id: p.id, name: p.name, rev, qty };
  }).sort((a, b) => b.rev - a.rev).filter(p => p.rev > 0).slice(0, 3);
  const maxRev = byRevenue[0]?.rev || 0;

  // Attention alerts.
  const productStats = products.map(p => {
    const pSales = currentSales.filter(s => s.productId === p.id);
    const rev = pSales.reduce((acc, s) => acc + saleRevenue(s), 0);
    const cost = p.purchasePrice || 0;
    const qty = pSales.reduce((acc, s) => acc + (s.quantitySold || 0), 0);
    const breakEvenPct = cost > 0 ? Math.min(100, (rev / cost) * 100) : 0;
    const { remainingPercentage } = stockOf(p, sales.filter((x: any) => x.productId === p.id));
    return { ...p, rev, profit: rev - cost, qty, cost, breakEvenPct, remainingPercentage };
  });

  const slowPayback = productStats.filter(p => p.qty > 0 && p.profit < 0);
  const notSelling = productStats.filter(p => p.qty === 0);
  const runningLow = productStats.filter(p => p.remainingPercentage <= 25 && p.remainingPercentage > 0);

  const padding = (n: any) => `${n.name}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Single Unified Time Period Selector */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {(['today', 'week', 'month', 'year', 'custom', 'all'] as const).map(period => {
          const isActive = timePeriod === period;
          return (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`pill-button px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#F5C518] text-black shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              {period === 'all' ? T('period.all') : period === 'today' ? T('period.today') : period === 'custom' ? T('period.custom') : `This ${period.charAt(0).toUpperCase() + period.slice(1)}`}
            </button>
          );
        })}
      </div>

      {timePeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold bg-card p-3 rounded-xl border border-border/60">
          <span className="text-muted-foreground">{T('dashboard.from')}</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-surface border border-border/60 rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-400 font-semibold"
          />
          <span className="text-muted-foreground">{T('dashboard.to')}</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-surface border border-border/60 rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-400 font-semibold"
          />
        </div>
      )}

      {/* Main Report Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-400/10 via-amber-400/5 to-transparent rounded-bl-[60px] pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F5C518]/15 text-amber-500 border border-[#F5C518]/30">
            <BarChart2 className="w-3.5 h-3.5" />
            {T('report.statusChip')}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-foreground mb-1 tracking-tight">
          {T('report.title')}
        </h2>

        <div className="text-base sm:text-lg font-extrabold text-foreground mb-3">
          {greeting}
        </div>

        {headline && (
          <div className="bg-surface/50 p-4 rounded-xl border border-border/40 mb-5 text-sm sm:text-base text-foreground font-medium leading-relaxed">
            {headline}
          </div>
        )}

        {/* Big Easy Numbers */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              {T('report.moneyGot')}
            </div>
            <div className="font-black text-lg sm:text-2xl text-foreground mt-2.5">₦{fmt(moneyMade)}</div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{T('report.moneyGotHint')}</div>
          </div>

          <div className={`rounded-xl p-3.5 sm:p-4 border ${profit < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${profit < 0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className={profit < 0 ? 'text-rose-400' : 'text-emerald-400'}>{T('report.yourProfit')}</span>
            </div>
            <div className={`font-black text-lg sm:text-2xl mt-2.5 ${profit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {profit < 0 ? '-' : ''}₦{fmt(Math.abs(profit))}
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{T('report.yourProfitHint')}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-wider">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              {T('report.moneySpent')}
            </div>
            <div className="font-black text-lg sm:text-2xl text-foreground mt-2.5">₦{fmt(moneySpent)}</div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{T('report.moneySpentHint')}</div>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-sky-400 font-bold uppercase tracking-wider">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              {T('report.stockWorth')}
            </div>
            <div className="font-black text-lg sm:text-2xl text-foreground mt-2.5">
              {stockCount > 0 ? `${stockCount.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '—'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
              {stockCount > 0 ? `≈ ₦${fmt(stockValue)}` : T('report.stockWorthHint')}
            </div>
          </div>
        </div>
      </div>

      {/* What Sells Best */}
      {byRevenue.length > 0 ? (
        <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 shadow-sm">
          <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-1 flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {T('report.bestSellers')}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">{T('report.bestSellersHint')}</p>
          <div className="flex flex-col gap-3">
            {byRevenue.map((p, i) => {
              const width = maxRev > 0 ? Math.max(12, (p.rev / maxRev) * 100) : 12;
              return (
                <div key={p.id} className="bg-surface/30 p-3 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 gap-2">
                    <span className="text-foreground truncate flex-1 min-w-0">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F5C518] text-black text-[10px] font-black mr-2 shrink-0">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-amber-400 shrink-0">₦{fmt(p.rev)}</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-border/40">
                    <div className="bg-gradient-to-r from-[#F5C518] to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/50 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-1">{T('report.noSalesTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{T('report.noSalesDesc')}</p>
        </div>
      )}

      {/* Things You Should Watch */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 shadow-sm">
        <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-4 flex items-center gap-2 tracking-tight">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          {T('report.attention')}
        </h3>

        {slowPayback.length === 0 && notSelling.length === 0 && runningLow.length === 0 ? (
          <div className="flex items-start gap-3 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-sm text-foreground font-medium">{T('report.allGood')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {runningLow.length > 0 && (
              <div className="flex items-start gap-3.5 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <div className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="text-sm text-foreground font-medium leading-relaxed">
                  {tf(lang, 'narrative.runningLow', runningLow.length > 1 ? tf(lang, 'narrative.runningLowOther', padding(runningLow[0]), runningLow.length - 1) : runningLow[0].name)}
                </div>
              </div>
            )}

            {slowPayback.length > 0 && (
              <div className="flex items-start gap-3.5 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                <div className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-orange-400" />
                <div className="text-sm font-medium leading-relaxed text-orange-700 dark:text-orange-300">
                  {tf(lang, 'narrative.highSalesLowProfit', slowPayback[0].name, slowPayback[0].rev.toLocaleString(), slowPayback[0].cost.toLocaleString(), slowPayback[0].breakEvenPct.toFixed(0))}
                </div>
              </div>
            )}

            {notSelling.length > 0 && currentSales.length > 0 && (
              <div className="flex items-start gap-3.5 bg-surface/50 p-4 rounded-xl border border-border/40">
                <div className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-foreground/40" />
                <div className="text-sm text-foreground font-medium leading-relaxed">
                  {tf(lang, 'narrative.notSelling', notSelling.length, notSelling[0].name)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}