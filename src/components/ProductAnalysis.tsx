import { useState } from 'react';
import { ShoppingBag, Package, Wallet, TrendingUp, Layers, CircleDollarSign, PieChart } from 'lucide-react';
import { saleRevenue, stockOf } from '../utils/finance';

export default function ProductAnalysis({ products, sales = [], onSell }: {
  products: any[];
  sales: any[];
  onSell?: (product: any) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>('');

  if (products.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-sm border border-border text-center">
        <h3 className="font-bold text-lg text-foreground mb-2">Business Analysis</h3>
        <p className="text-sm text-muted-foreground">Add a product and start selling to see its analysis here.</p>
      </div>
    );
  }

  // 'all' = whole business, otherwise the specific product (falls back to the first one)
  const isAll = selectedId === 'all';
  const selected = isAll
    ? null
    : products.find(p => p.id === selectedId) || products[0] || null;
  const activeId = isAll ? 'all' : (selected?.id || '');

  const productSales = selected
    ? sales.filter(s => s.productId === selected.id)
    : sales;

  // Financials (same payback model as the dashboard)
  const moneyMade = productSales.reduce((acc: number, s: any) => acc + saleRevenue(s), 0);
  const soldProductIds = new Set(
    productSales.filter(s => saleRevenue(s) > 0 && s.productId).map(s => s.productId)
  );
  const goodsCost = selected
    ? (selected.purchasePrice || 0)
    : products.reduce((acc: number, p: any) =>
        soldProductIds.has(p.id) ? acc + (p.purchasePrice || 0) : acc, 0);
  const profit = moneyMade - goodsCost;
  const breakEvenPct = goodsCost > 0 ? (moneyMade / goodsCost) * 100 : 0;

  // Stock picture: reduces little by little as money comes in until the cost is covered
  let totalPurchased = 0;
  let qtyRemaining = 0;
  if (selected) {
    const s = stockOf(selected, productSales);
    totalPurchased = selected.quantityPurchased || 0;
    qtyRemaining = s.qtyRemaining;
  } else {
    products.forEach((p: any) => {
      totalPurchased += (p.quantityPurchased || 0);
      qtyRemaining += stockOf(p, sales.filter((x: any) => x.productId === p.id)).qtyRemaining;
    });
  }
  const stockPct = totalPurchased > 0 ? Math.max(0, (qtyRemaining / totalPurchased) * 100) : 0;

  const unitsSold = productSales.reduce((acc: number, s: any) => acc + (s.quantitySold || 0), 0);

  // Top selling unit
  const byUnit: any = {};
  productSales.forEach(s => {
    const key = s.unitName || 'Unit';
    byUnit[key] = byUnit[key] || { unitName: key, revenue: 0, qty: 0 };
    byUnit[key].revenue += saleRevenue(s);
    byUnit[key].qty += (s.quantitySold || 0);
  });
  const topUnit = Object.values(byUnit).sort((a: any, b: any) => b.revenue - a.revenue)[0] as any;

  const recentSales = [...productSales]
    .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 6);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtSigned = (n: number) => (n < 0 ? '-' : '') + '₦' + fmt(Math.abs(n));

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border/50 shadow-sm">
      {/* Header + Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2 tracking-tight">
            <PieChart className="w-5 h-5 text-amber-400" />
            Product Financials
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Performance breakdown per item</p>
        </div>
        
        {/* Product selector pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedId('all')}
            className={`pill-button px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeId === 'all'
                ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/20'
                : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All Products
          </button>
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`pill-button px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeId === p.id
                  ? 'bg-[#F5C518] text-black shadow-md shadow-amber-500/20'
                  : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main numbers - Vertical grid on mobile & reduced desktop, 3-col on wide desktop */}
      <div className="flex flex-col gap-3.5 mb-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Money Made */}
          <div className="bg-surface/70 rounded-xl p-3 sm:p-4 border border-border/40 flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Money Made</span>
            </div>
            <div className="font-black text-base sm:text-lg xl:text-xl text-foreground text-right xl:text-left xl:mt-2 shrink-0 whitespace-nowrap" title={`₦${fmt(moneyMade)}`}>
              ₦{fmt(moneyMade)}
            </div>
          </div>
          
          {/* Goods Cost */}
          <div className="bg-surface/70 rounded-xl p-3 sm:p-4 border border-border/40 flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Goods Cost</span>
            </div>
            <div className="font-black text-base sm:text-lg xl:text-xl text-foreground text-right xl:text-left xl:mt-2 shrink-0 whitespace-nowrap" title={`₦${fmt(goodsCost)}`}>
              ₦{fmt(goodsCost)}
            </div>
          </div>
          
          {/* Gross Profit */}
          <div className={`rounded-xl p-3 sm:p-4 border flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0 ${profit < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${profit < 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Gross Profit</span>
            </div>
            <div className={`font-black text-base sm:text-lg xl:text-xl text-right xl:text-left xl:mt-2 shrink-0 whitespace-nowrap ${profit < 0 ? 'text-rose-400' : 'text-emerald-400'}`} title={fmtSigned(profit)}>
              {fmtSigned(profit)}
            </div>
          </div>
        </div>

        {/* Break-even progress */}
        {goodsCost > 0 && (
          <div className="bg-surface/40 p-3.5 sm:p-4 rounded-xl border border-border/40">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2 flex-wrap gap-1.5">
              <span>Cost Recovery Progress</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${moneyMade >= goodsCost ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {moneyMade >= goodsCost ? 'Cost Covered ✓' : `₦${fmt(Math.max(0, goodsCost - moneyMade))} to recover`}
              </span>
            </div>
            <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${breakEvenPct >= 100 ? 'bg-emerald-400' : 'bg-[#F5C518]'}`}
                style={{ width: `${Math.min(100, breakEvenPct)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">
              ₦{fmt(moneyMade)} of ₦{fmt(goodsCost)} recovered ({breakEvenPct.toFixed(0)}%). Gross profit counts positive once cost is covered.
            </div>
          </div>
        )}

        {/* Stock & sales micro-metrics - Vertical grid on mobile & reduced desktop, 3-col on wide desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Stock Left */}
          <div className="bg-surface/50 rounded-xl p-3 sm:p-4 border border-border/40 flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Package className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Stock Left</span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm xl:text-base text-foreground text-right xl:text-left xl:mt-2 shrink-0 whitespace-nowrap">
              {qtyRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}{selected ? ` ${selected.purchaseUnit || ''}` : ''}
              <span className="text-muted-foreground font-semibold text-[11px] sm:text-xs ml-1.5">({stockPct.toFixed(0)}%)</span>
            </div>
          </div>
          
          {/* Units Sold */}
          <div className="bg-surface/50 rounded-xl p-3 sm:p-4 border border-border/40 flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Units Sold</span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm xl:text-base text-foreground text-right xl:text-left xl:mt-2 shrink-0 whitespace-nowrap">
              {unitsSold.toLocaleString()}
            </div>
          </div>
          
          {/* Top Selling */}
          <div className="bg-surface/50 rounded-xl p-3 sm:p-4 border border-border/40 flex items-center justify-between xl:flex-col xl:items-start xl:justify-between gap-2.5 min-w-0">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                <CircleDollarSign className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">Top Selling</span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm xl:text-base text-foreground text-right xl:text-left xl:mt-2 break-words">
              {topUnit ? `${topUnit.unitName} (₦${fmt(topUnit.revenue)})` : 'None yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Sell CTA Button */}
      {selected && onSell && (
        <button
          onClick={() => onSell(selected)}
          className="pill-button w-full sm:w-auto mb-6 flex items-center justify-center gap-2 bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold py-3.5 px-7 rounded-full transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          <ShoppingBag className="w-4 h-4" /> Record Sale for {selected.name}
        </button>
      )}

      {/* Recent sales for this product */}
      {selected && recentSales.length > 0 && (
        <div className="border-t border-border/60 pt-5 mt-2">
          <h4 className="font-bold text-sm text-foreground mb-3 tracking-tight">Recent Sales of {selected.name}</h4>
          <div className="flex flex-col gap-2">
            {recentSales.map((s: any, idx: number) => (
              <div key={s.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-surface/40 hover:bg-surface border border-border/50 transition-all min-w-0">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-bold text-foreground text-sm truncate">
                    {s.quantitySold} {s.unitName}{s.quantitySold > 1 ? 's' : ''}
                    {s.sellingPricePerUnit ? ` × ₦${fmt(s.sellingPricePerUnit)}` : ''}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Recently'}
                  </div>
                </div>
                <div className="font-extrabold text-emerald-400 text-sm shrink-0">+₦{fmt(saleRevenue(s))}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && recentSales.length === 0 && (
        <p className="text-sm text-muted-foreground pt-4 border-t border-border/50">
          No sales recorded for {selected.name} yet. Tap "Record Sale" above.
        </p>
      )}
    </div>
  );
}