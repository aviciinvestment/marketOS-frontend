import { useState, useMemo } from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { calculateFinancials, stockOf } from '../utils/finance';
import AlertDialog from './ui/AlertDialog';

export default function DashboardView({ 
  sales, 
  expenses, 
  products,
  deviceId,
  onEditSale,
  onDeleteSale,
  onEditExpense,
  onDeleteExpense
}: { 
  sales: any[], 
  expenses: any[], 
  products: any[],
  deviceId?: string,
  onEditSale?: (sale: any) => void,
  onDeleteSale?: (saleId: string) => void,
  onEditExpense?: (expense: any) => void,
  onDeleteExpense?: (expenseId: string) => void
}) {
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    type: 'sale' | 'expense';
    title: string;
    desc: string;
  } | null>(null);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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

  const filteredSales = useMemo(() => filterByTime(sales), [sales, timePeriod]);
  const filteredExpenses = useMemo(() => filterByTime(expenses), [expenses, timePeriod]);

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
  let greetingMsg = "Here is how your business is doing.";
  if (profit > 0) {
    greetingMsg = "You're doing great! Your business is making money.";
  } else if (profit < 0) {
    greetingMsg = "You're running at a loss currently. Keep an eye on expenses.";
  } else if (moneyIn === 0) {
    greetingMsg = "No sales recorded for this period yet.";
  }

  const financialStory = `You made ₦${productProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} in profit from selling your products. You spent ₦${moneyOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} on running the business. After these expenses, your estimated profit is ₦${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`;

  let productMsg = "";
  if (bestProduct) {
    productMsg = `${bestProduct.name} is your top-selling product.`;
  }

  let stockMsg = "";
  if (finishedProducts.length > 0) {
    stockMsg = `${finishedProducts.length} product(s) are completely finished.`;
  } else if (lowStockProducts.length > 0) {
    stockMsg = `${lowStockProducts.length} product(s) are running low.`;
  } else if (products.length > 0) {
    stockMsg = "Your stock levels are looking healthy.";
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Time Period Selector - Sleek Pill Tabs */}
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
              {period === 'all' ? 'All Time' : period === 'today' ? 'Today' : period === 'custom' ? 'Custom' : `This ${period}`}
            </button>
          );
        })}
      </div>

      {timePeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <input 
            type="date" 
            value={customStart} 
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-card border border-border/60 rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-400 font-semibold"
          />
          <span className="text-muted-foreground">to</span>
          <input 
            type="date" 
            value={customEnd} 
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-card border border-border/60 rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-400 font-semibold"
          />
        </div>
      )}

      {/* Personal Assistant Story Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 xl:p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-400/10 via-amber-400/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-[#F5C518]/15 text-amber-500 border border-[#F5C518]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
            Business Summary
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

      {/* Main Financial KPIs Grid - 2 cols on tablet/desktop, 1 col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        
        {/* 1. Money Made */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
          <div className="min-w-0">
            {/* Top row: Icon on left, Tag on right */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/70 text-emerald-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                Sales
              </span>
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Money Made
            </div>

            {/* Big Currency Value */}
            <div 
              className="text-xl sm:text-2xl xl:text-3xl font-black tracking-tight text-foreground my-1 break-words"
              title={`₦${moneyIn.toLocaleString()}`}
            >
              ₦{moneyIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Bottom Explanatory Caption - Fully visible */}
          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            Total collected from customers
          </div>
        </div>

        {/* 2. Gross Profit */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-sky-400/30 transition-all group">
          <div className="min-w-0">
            {/* Top row: Icon on left, Tag on right */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-sky-400" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/70 text-sky-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                Product
              </span>
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Gross Profit
            </div>

            {/* Big Currency Value */}
            <div 
              className={`text-xl sm:text-2xl xl:text-3xl font-black tracking-tight my-1 break-words ${productProfit < 0 ? 'text-rose-400' : 'text-sky-400'}`}
              title={`${productProfit < 0 ? '-' : ''}₦${Math.abs(productProfit).toLocaleString()}`}
            >
              {productProfit < 0 ? '-' : ''}₦{Math.abs(productProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Bottom Explanatory Caption - Fully visible */}
          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            Sales minus cost of goods
          </div>
        </div>
        
        {/* 3. Expenses */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-amber-400/30 transition-all group">
          <div className="min-w-0">
            {/* Top row: Icon on left, Tag on right */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/70 text-amber-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                Operations
              </span>
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Expenses
            </div>

            {/* Big Currency Value */}
            <div 
              className="text-xl sm:text-2xl xl:text-3xl font-black tracking-tight text-amber-400 my-1 break-words"
              title={`₦${moneyOut.toLocaleString()}`}
            >
              ₦{moneyOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Bottom Explanatory Caption - Fully visible */}
          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            Transport, power & other costs
          </div>
        </div>

        {/* 4. Net Profit - Standout Card */}
        <div className="min-w-0 bg-card rounded-2xl p-3.5 sm:p-4 xl:p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:border-emerald-400/30 transition-all group">
          <div className="min-w-0">
            {/* Top row: Icon on left, Tag on right */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 uppercase tracking-wider whitespace-nowrap">
                Take-Home
              </span>
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Net Profit
            </div>

            {/* Big Currency Value */}
            <div 
              className={`text-xl sm:text-2xl xl:text-3xl font-black tracking-tight my-1 break-words ${profit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}
              title={`${profit < 0 ? '-' : ''}₦${Math.abs(profit).toLocaleString()}`}
            >
              {profit < 0 ? '-' : ''}₦{Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Bottom Explanatory Caption - Fully visible */}
          <div className="text-xs text-muted-foreground font-medium pt-2.5 mt-1.5 border-t border-border/40 leading-relaxed">
            Gross profit minus expenses
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-extrabold text-foreground text-lg tracking-tight">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest sales and business expenses</p>
          </div>
        </div>
        
        {filteredSales.length === 0 && filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm bg-surface/50 rounded-xl border border-dashed border-border">
            No activity recorded for this period yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {[...filteredSales.map(s => ({...s, type: 'sale'})), ...filteredExpenses.map(e => ({...e, type: 'expense'}))]
              .sort((a, b) => new Date(b.timestamp || b.date || 0).getTime() - new Date(a.timestamp || a.date || 0).getTime())
              .slice(0, 8)
              .map((activity, idx) => (
                <div 
                  key={activity.id || idx} 
                  className="flex justify-between items-center p-3 sm:p-3.5 rounded-xl bg-surface/40 hover:bg-surface border border-border/50 hover:border-border transition-all min-w-0 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activity.type === 'sale' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {activity.type === 'sale' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-sm break-words flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span>{activity.type === 'sale' ? `Sold ${activity.productName}` : activity.category || 'Expense'}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground uppercase">
                          {activity.type === 'sale' ? (activity.unitName ? `${activity.quantitySold} ${activity.unitName}` : 'Sale') : 'Expense'}
                        </span>
                        {activity.updatedByDevice ? (
                          activity.updatedByDevice === deviceId ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              This device
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              Another device
                            </span>
                          )
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 break-words">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        {activity.description ? ` · ${activity.description}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                    <div className={`font-extrabold text-sm sm:text-base ${
                      activity.type === 'sale' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {activity.type === 'sale' ? '+' : '-'}₦{(activity.totalRevenue || activity.amount || 0).toLocaleString()}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {activity.type === 'sale' && onEditSale && (
                        <button
                          type="button"
                          onClick={() => onEditSale(activity)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-surface border border-border/40 hover:border-amber-400/40 transition-colors"
                          title="Edit Sale Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activity.type === 'sale' && onDeleteSale && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmItem({
                              type: 'sale',
                              id: activity.id,
                              title: `Delete Sale of ${activity.productName || 'this item'}`,
                              desc: `Are you sure you want to delete this sale record (+₦${(activity.totalRevenue || activity.amount || 0).toLocaleString()})? This will be removed across all devices.`
                            });
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-surface border border-border/40 hover:border-rose-400/40 transition-colors"
                          title="Delete Sale Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activity.type === 'expense' && onEditExpense && (
                        <button
                          type="button"
                          onClick={() => onEditExpense(activity)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-surface border border-border/40 hover:border-amber-400/40 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activity.type === 'expense' && onDeleteExpense && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmItem({
                              type: 'expense',
                              id: activity.id,
                              title: `Delete Expense "${activity.category || activity.description || 'Expense'}"`,
                              desc: `Are you sure you want to delete this expense record (-₦${(activity.amount || 0).toLocaleString()})? This will be removed across all devices.`
                            });
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-surface border border-border/40 hover:border-rose-400/40 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={!!deleteConfirmItem}
        title={deleteConfirmItem?.title || "Delete Record"}
        description={deleteConfirmItem?.desc || "Are you sure you want to delete this record?"}
        type="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteConfirmItem) {
            if (deleteConfirmItem.type === 'sale' && onDeleteSale) {
              onDeleteSale(deleteConfirmItem.id);
            } else if (deleteConfirmItem.type === 'expense' && onDeleteExpense) {
              onDeleteExpense(deleteConfirmItem.id);
            }
            setDeleteConfirmItem(null);
          }
        }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

    </div>
  );
}
