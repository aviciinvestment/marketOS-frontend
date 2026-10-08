import { useState, useMemo } from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { calculateFinancials, stockOf } from '../utils/finance';
import { useAppT, useAppLang, tf } from '../i18n';

export default function DashboardView({ 
  sales, 
  expenses, 
  products,
  timePeriod: controlledTimePeriod,
  setTimePeriod: setControlledTimePeriod,
  customStart: controlledCustomStart,
  setCustomStart: setControlledCustomStart,
  customEnd: controlledCustomEnd,
  setCustomEnd: setControlledCustomEnd
}: { 
  sales: any[]; 
  expenses: any[]; 
  products: any[];
  deviceId?: string;
  timePeriod?: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
  setTimePeriod?: (period: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom') => void;
  customStart?: string;
  setCustomStart?: (start: string) => void;
  customEnd?: string;
  setCustomEnd?: (end: string) => void;
  onEditSale?: (sale: any) => void;
  onDeleteSale?: (saleId: string) => void;
  onEditExpense?: (expense: any) => void;
  onDeleteExpense?: (expenseId: string) => void;
}) {
  const [localTimePeriod, setLocalTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('today');
  const [localCustomStart, setLocalCustomStart] = useState('');
  const [localCustomEnd, setLocalCustomEnd] = useState('');

  const T = useAppT();
  const lang = useAppLang();

  const timePeriod = controlledTimePeriod !== undefined ? controlledTimePeriod : localTimePeriod;
  const setTimePeriod = setControlledTimePeriod || setLocalTimePeriod;
  const customStart = controlledCustomStart !== undefined ? controlledCustomStart : localCustomStart;
  const setCustomStart = setControlledCustomStart || setLocalCustomStart;
  const customEnd = controlledCustomEnd !== undefined ? controlledCustomEnd : localCustomEnd;
  const setCustomEnd = setControlledCustomEnd || setLocalCustomEnd;

  // Filter logic based on timestamp
  const now = new Date();
  const filterByTime = (items: any[], dateField: string = 'timestamp') => {
    return items.filter(item => {
      if (timePeriod === 'all') return true;
      const itemDate = new Date(item[dateField] || item.date || Date.now());
      if (isNaN(itemDate.getTime())) return true; // Fallback for old/bad data

      if (timePeriod === 'custom') {
        if (!customStart || !customEnd) return true;
        const s = new Date(customStart); s.setHours(0, 0, 0, 0);
        const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
        return itemDate >= s && itemDate <= e;
      }

      if (timePeriod === 'today') {
        return itemDate.toDateString() === now.toDateString();
      }
      
      const timeDiff = now.getTime() - itemDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      if (timePeriod === 'week') return daysDiff <= 7;
      if (timePeriod === 'month') return daysDiff <= 30;
      if (timePeriod === 'year') return daysDiff <= 365;
      return true;
    });
  };

  const filteredSales = useMemo(() => filterByTime(sales), [sales, timePeriod, customStart, customEnd]);
  const filteredExpenses = useMemo(() => filterByTime(expenses), [expenses, timePeriod, customStart, customEnd]);

  const { totalSales: moneyIn, grossProfit: productProfit, totalExpenses: moneyOut, netProfit: profit } = useMemo(
    () => calculateFinancials(filteredSales, filteredExpenses, products),
    [filteredSales, filteredExpenses, products]
  );

  // Best performing product logic
  const productPerformance = filteredSales.reduce((acc: any, sale) => {
    if (!sale.productId) return acc;
    if (!acc[sale.productId]) acc[sale.productId] = { revenue: 0, qty: 0, name: sale.productName };
    acc[sale.productId].revenue += (sale.totalRevenue || sale.amount || 0);
    acc[sale.productId].qty += (sale.quantitySold || 0);
    return acc;
  }, {});

  const bestProduct = Object.values(productPerformance).sort((a: any, b: any) => b.revenue - a.revenue)[0] as any;

  // Products running low: stock reduces little by little as money comes in.
  const lowStockProducts = products.filter(p => {
    const { remainingPercentage } = stockOf(p, sales);
    return remainingPercentage <= 25 && remainingPercentage > 0;
  });
  
  // A product is only truly "finished" once its cost has been fully covered.
  const finishedProducts = products.filter(p => {
    return stockOf(p, sales).fractionConsumed >= 1;
  });

  // Storytelling messages
  let greetingMsg = T('dash.doingWell');
  if (profit > 0) {
    greetingMsg = T('dash.great');
  } else if (profit < 0) {
    greetingMsg = T('dash.loss');
  } else if (moneyIn === 0) {
    greetingMsg = T('dash.welcome');
  }

  let financialStory = `${tf(lang, 'story.inThisPeriod', moneyIn.toLocaleString())} `;
  if (productProfit > 0) {
    financialStory += `${tf(lang, 'story.afterCosts', productProfit.toLocaleString())} `;
  }
  if (moneyOut > 0) {
    financialStory += `${tf(lang, 'story.spentCosts', moneyOut.toLocaleString())} `;
  }
  if (profit > 0) {
    financialStory += tf(lang, 'story.cleanProfit', profit.toLocaleString());
  } else if (profit < 0) {
    financialStory += tf(lang, 'story.spendingExceeds', Math.abs(profit).toLocaleString());
  }

  let productMsg = "";
  if (bestProduct && bestProduct.revenue > 0) {
    productMsg = tf(lang, 'msg.topSeller', bestProduct.name, bestProduct.revenue.toLocaleString());
  }

  let stockMsg = "";
  if (finishedProducts.length > 0) {
    stockMsg = tf(lang, 'msg.finished', finishedProducts.length);
  } else if (lowStockProducts.length > 0) {
    stockMsg = tf(lang, 'msg.low', lowStockProducts.length);
  } else if (products.length > 0) {
    stockMsg = T('msg.stockHealthy');
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Single Unified Time Period Selector - Sleek Pill Tabs Serving All Insights */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {(['today', 'week', 'month', 'year', 'custom', 'all'] as const).map(period => {
          const isActive = timePeriod === period;
          return (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`pill-button px-3 sm:px-4 xl:px-5 py-1.5 sm:py-2 xl:py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
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

      {/* Personal Assistant Story Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 xl:p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-400/10 via-amber-400/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-[#F5C518]/15 text-amber-500 border border-[#F5C518]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
            {T('dashboard.businessSummary')}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl xl:text-2xl font-extrabold text-foreground mb-1.5 leading-snug tracking-tight">
          {greetingMsg}
        </h2>
        
        <p className="text-muted-foreground text-xs sm:text-sm xl:text-base font-normal mb-4 max-w-3xl leading-relaxed">
          {financialStory}
        </p>

        <div className="flex flex-wrap gap-2 pt-0.5">
          {productMsg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              {productMsg}
            </span>
          )}
          {stockMsg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              {stockMsg}
            </span>
          )}
        </div>
      </div>

      {/* Main Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        
        {/* 1. Money Made */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                {T('kpi.moneyIn')}
              </span>
            </div>

            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {T('kpi.totalRevenue')}
            </div>

            <div 
              className="text-xl sm:text-2xl xl:text-3xl font-black text-foreground tracking-tight my-1 break-words"
              title={`₦${moneyIn.toLocaleString()}`}
            >
              ₦{moneyIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            {T('kpi.totalRevenueDesc')}
          </div>
        </div>

        {/* 2. Product Profit */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-all group">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-amber-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                {T('kpi.markup')}
              </span>
            </div>

            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {T('analysis.grossProfit')}
            </div>

            <div 
              className="text-xl sm:text-2xl xl:text-3xl font-black text-amber-400 tracking-tight my-1 break-words"
              title={`₦${productProfit.toLocaleString()}`}
            >
              ₦{productProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            {T('kpi.grossProfitDesc')}
          </div>
        </div>

        {/* 3. Business Expenses */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-rose-500/30 transition-all group">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-rose-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                {T('kpi.moneyOut')}
              </span>
            </div>

            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {T('kpi.opCosts')}
            </div>

            <div 
              className="text-xl sm:text-2xl xl:text-3xl font-black text-rose-400 tracking-tight my-1 break-words"
              title={`₦${moneyOut.toLocaleString()}`}
            >
              ₦{moneyOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            {T('kpi.opCostsDesc')}
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                {T('kpi.takeHome')}
              </span>
            </div>

            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              {T('kpi.netProfit')}
            </div>

            <div 
              className={`text-xl sm:text-2xl xl:text-3xl font-black tracking-tight my-1 break-words ${profit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}
              title={`${profit < 0 ? '-' : ''}₦${Math.abs(profit).toLocaleString()}`}
            >
              {profit < 0 ? '-' : ''}₦{Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            {T('kpi.netProfitDesc')}
          </div>
        </div>
      </div>

    </div>
  );
}
