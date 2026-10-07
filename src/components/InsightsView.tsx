import { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, Activity } from 'lucide-react';
import { calculateFinancials, saleRevenue, stockOf } from '../utils/finance';

export default function InsightsView({ sales, products }: { sales: any[], expenses: any[], products: any[] }) {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  
  // Custom date range state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const now = new Date();

  // Helper to filter sales/expenses by period
  const filterData = (items: any[], period: string, start?: Date, end?: Date) => {
    return items.filter(item => {
      const itemDate = new Date(item.timestamp || item.date || Date.now());
      if (isNaN(itemDate.getTime())) return true;
      
      if (period === 'custom') {
        if (!start || !end) return true;
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end); e.setHours(23,59,59,999);
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

  // Helper to get previous period (for comparison)
  const filterPreviousData = (items: any[], period: string, start?: Date, end?: Date) => {
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

  // Aggregate current period
  const { totalSales: currentRevenue, grossProfit: currentGrossProfit } = useMemo(
    () => calculateFinancials(currentSales, [], products), 
    [currentSales, products]
  );

  // Aggregate previous period
  const { totalSales: prevRevenue, grossProfit: prevGrossProfit } = useMemo(
    () => calculateFinancials(previousSales, [], products),
    [previousSales, products]
  );
  
  // Product Performance Calculation.
  // Profit = money made from the product - its total purchase cost (payback model).
  // It stays negative until the sales have covered what the goods cost.
  const productStats = products.map(p => {
    const pSales = currentSales.filter(s => s.productId === p.id);
    const rev = pSales.reduce((acc, s) => acc + saleRevenue(s), 0);
    const cost = p.purchasePrice || 0;
    const profit = pSales.length > 0 ? rev - cost : 0;
    const qty = pSales.reduce((acc, s) => acc + (s.quantitySold || 0), 0);
    const breakEvenPct = cost > 0 ? Math.min(100, (rev / cost) * 100) : 0;
    
    // Remaining stock check (reduces little by little as money comes in)
    const { remainingPercentage } = stockOf(p, sales);
    
    return { ...p, rev, profit, qty, cost, breakEvenPct, remainingPercentage };
  });

  // Sortings
  const byProfit = [...productStats].sort((a, b) => b.profit - a.profit);
  const byRevenue = [...productStats].sort((a, b) => b.rev - a.rev);
  const byQty = [...productStats].sort((a, b) => b.qty - a.qty);
  
  const mostProfitProduct = byProfit[0]?.profit > 0 ? byProfit[0] : null;
  const highestQtyProduct = byQty[0]?.qty > 0 ? byQty[0] : null;
  
  const notSelling = productStats.filter(p => p.qty === 0);
  const runningLow = productStats.filter(p => p.remainingPercentage <= 25 && p.remainingPercentage > 0);
  // Products that are selling but still haven't earned back their purchase cost
  const highSalesLowProfit = productStats.filter(p => p.qty > 0 && p.profit < 0);

  // Formulate textual insights
  const insights: React.ReactNode[] = [];

  // 1. Business Growth Insight
  if (currentSales.length === 0 && previousSales.length === 0) {
    insights.push(<p>You haven't recorded any sales yet for this period. Start recording sales to see insights.</p>);
  } else if (previousSales.length === 0) {
    insights.push(<p>This is your first period recording sales! You made <b>₦{currentGrossProfit.toLocaleString()}</b> in gross profit from <b>₦{currentRevenue.toLocaleString()}</b> in sales.</p>);
  } else {
    // Compare periods
    const revDiff = currentRevenue - prevRevenue;
    const profitDiff = currentGrossProfit - prevGrossProfit;
    
    if (revDiff > 0 && profitDiff > 0) {
      insights.push(<p>Your business is growing. Your sales increased by <b>₦{revDiff.toLocaleString()}</b>, and your gross profit also went up by <b>₦{profitDiff.toLocaleString()}</b> compared to the previous period.</p>);
    } else if (revDiff > 0 && profitDiff <= 0) {
      insights.push(<p>Your sales increased, but your gross profit did not. You sold more, but the items you sold had lower profit margins than before.</p>);
    } else if (revDiff < 0 && profitDiff < 0) {
      insights.push(<p>Your sales and gross profit are lower than the previous period. You made <b>₦{Math.abs(revDiff).toLocaleString()}</b> less in revenue.</p>);
    } else if (revDiff < 0 && profitDiff >= 0) {
      insights.push(<p>You made fewer sales, but your gross profit actually went up! This means you sold items with much better profit margins.</p>);
    } else {
      insights.push(<p>Your business performance remained roughly the same as the previous period.</p>);
    }
  }

  // 2. Product Level Insights
  if (mostProfitProduct) {
    insights.push(<p><b>{mostProfitProduct.name}</b> generated the most gross profit (₦{mostProfitProduct.profit.toLocaleString()}).</p>);
  }
  if (highestQtyProduct && highestQtyProduct.id !== mostProfitProduct?.id) {
    insights.push(<p><b>{highestQtyProduct.name}</b> was your most popular item by volume, selling {highestQtyProduct.qty} units.</p>);
  }
  
  if (highSalesLowProfit.length > 0) {
    const h = highSalesLowProfit[0];
    insights.push(
      <p className="text-orange-600 dark:text-orange-400">
        You are selling a lot of <b>{h.name}</b>, but you haven't earned back what it cost you yet — <b>₦{h.rev.toLocaleString()}</b> made of the <b>₦{h.cost.toLocaleString()}</b> spent ({h.breakEvenPct.toFixed(0)}% recovered). Keep selling to break even.
      </p>
    );
  }

  if (notSelling.length > 0 && currentSales.length > 0) {
    insights.push(
      <p className="text-muted-foreground">
        {notSelling.length} product(s) did not sell at all during this period, including <b>{notSelling[0].name}</b>.
      </p>
    );
  }

  if (runningLow.length > 0) {
    insights.push(
      <p className="text-red-500">
        <b>{runningLow[0].name}</b> {runningLow.length > 1 ? `and ${runningLow.length - 1} other product(s)` : ''} are running low on stock. Restock soon so you don't miss out on sales!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['today', 'week', 'month', 'year', 'custom'] as const).map(period => {
            const isActive = timePeriod === period;
            return (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`pill-button px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                  isActive 
                    ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/20' 
                    : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>

        {timePeriod === 'custom' && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <input 
              type="date" 
              value={customStart} 
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-surface border border-border/50 rounded-xl px-3 py-1.5 text-foreground outline-none focus:border-amber-400 font-medium"
            />
            <span className="text-muted-foreground">to</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-surface border border-border/50 rounded-xl px-3 py-1.5 text-foreground outline-none focus:border-amber-400 font-medium"
            />
          </div>
        )}
      </div>

      {/* Narrative Insights Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-400/10 via-amber-400/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F5C518]/15 text-amber-500 border border-[#F5C518]/30">
            <BarChart2 className="w-3.5 h-3.5" />
            Performance Intel
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-foreground mb-6 tracking-tight">
          Executive Insights
        </h2>
        
        <div className="flex flex-col gap-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3.5 bg-surface/50 p-4 rounded-xl border border-border/40 hover:border-border/70 transition-all">
              <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#F5C518]" />
              <div className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                {insight}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Product Breakdown */}
      {currentSales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          
          {/* Top Products by Profit */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 shadow-sm min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Most Profitable Products
            </h3>
            <div className="flex flex-col gap-3">
              {byProfit.filter(p => p.profit > 0).slice(0, 4).map(product => {
                const maxProfit = byProfit[0].profit;
                const width = Math.max(10, (product.profit / maxProfit) * 100);
                return (
                  <div key={product.id} className="bg-surface/30 p-3 rounded-xl border border-border/40 min-w-0">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 gap-2">
                      <span className="text-foreground truncate flex-1 min-w-0">{product.name}</span>
                      <span className="text-emerald-400 shrink-0">₦{product.profit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products by Revenue */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 shadow-sm min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <Activity className="w-5 h-5 text-amber-400" />
              Highest Revenue Products
            </h3>
            <div className="flex flex-col gap-3">
              {byRevenue.filter(p => p.rev > 0).slice(0, 4).map(product => {
                const maxRev = byRevenue[0].rev;
                const width = Math.max(10, (product.rev / maxRev) * 100);
                return (
                  <div key={product.id} className="bg-surface/30 p-3 rounded-xl border border-border/40 min-w-0">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 gap-2">
                      <span className="text-foreground truncate flex-1 min-w-0">{product.name}</span>
                      <span className="text-amber-400 shrink-0">₦{product.rev.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
                      <div className="bg-[#F5C518] h-full rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
