import { Edit, Trash2, AlertCircle, PackagePlus } from 'lucide-react';
import { saleRevenue, stockOf } from '../utils/finance';
import { useAppT, useAppLang, tf } from '../i18n';

export default function ProductsTable({ 
  products, 
  sales = [],
  onEdit, 
  onDelete,
  onAdd
}: { 
  products: any[]; 
  sales?: any[];
  onEdit: (product: any) => void; 
  onDelete: (id: string) => void; 
  onAdd?: () => void;
}) {
  const T = useAppT();
  const lang = useAppLang();

  if (products.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 sm:p-12 shadow-sm border border-border text-center flex flex-col items-center gap-4 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
          <PackagePlus className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground mb-1.5">{T('stock.addFirstTitle')}</h2>
          <p className="text-muted-foreground text-sm">{T('stock.addFirstDesc')}</p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="pill-button bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm transition-all hover:scale-[1.02]"
          >
            <PackagePlus className="w-4 h-4" />
            {T('stock.addFirstBtn')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
      {products.map((product) => {
        // Financial calculations for this specific product.
        // Profit is the "payback" figure: all money made from this product minus
        // the total cost of the goods. It is negative until sales cover that cost.
        const productSales = sales.filter(s => s.productId === product.id);
        const totalRevenue = productSales.reduce((acc, s) => acc + saleRevenue(s), 0);
        const goodsCost = product.purchasePrice || 0;
        const totalProfit = totalRevenue - goodsCost;
        const isLoss = totalProfit < 0;
        
        // Stock tracking: reduces little by little as money comes in, and is only
        // exhausted once the total cost has been covered.
        const stock = stockOf(product, sales);
        const { remainingPercentage, qtyRemaining, qtySold, remainingValue } = stock;
        const paidBack = totalRevenue >= goodsCost;

        const formatQty = (q: number) => q.toLocaleString(undefined, { maximumFractionDigits: 2 });

        // Status indicator pills
        let stockStatus = null;
        if (remainingPercentage <= 0) {
          if (paidBack) {
            stockStatus = <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 whitespace-nowrap"><AlertCircle className="w-3 h-3"/> {T('table.finished')}</span>;
          } else {
            stockStatus = <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 whitespace-nowrap" title={T('table.payingBackTip')}><AlertCircle className="w-3 h-3"/> {T('table.payingBack')}</span>;
          }
        } else if (remainingPercentage <= 10) {
          stockStatus = <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 whitespace-nowrap"><AlertCircle className="w-3 h-3"/> {T('table.restockSoon')}</span>;
        } else if (remainingPercentage <= 25) {
          stockStatus = <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 whitespace-nowrap">{T('table.runningLow')}</span>;
        }

        return (
          <div key={product.id} className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 shadow-sm relative flex flex-col justify-between hover:border-white/20 transition-all group min-w-0">
            
            <div>
              {/* Header */}
              <div className="flex justify-between items-start gap-3 mb-5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground leading-tight tracking-tight mb-1 break-words" title={product.name}>{product.name}</h3>
                  <div className="text-xs text-muted-foreground font-medium break-words">
                    {tf(lang, 'table.bought', formatQty(product.quantityPurchased), product.purchaseUnit, product.purchasePrice?.toLocaleString())}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={() => onEdit(product)} 
                    className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title={T('table.edit')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDelete(product.id)} 
                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 flex items-center justify-center transition-colors"
                    title={T('table.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Inventory Core: What I have left */}
              <div className="mb-5">
                <div className="flex justify-between items-end gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{T('table.whatLeft')}</div>
                    <div className="font-black text-2xl sm:text-3xl text-foreground tracking-tight break-words">
                      {formatQty(qtyRemaining)} <span className="text-xs sm:text-sm font-semibold text-muted-foreground">{product.purchaseUnit}</span>
                    </div>
                  </div>
                  {stockStatus}
                </div>
                
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden mt-3 mb-2.5 border border-border/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${remainingPercentage <= 10 ? 'bg-rose-500' : remainingPercentage <= 25 ? 'bg-[#F5C518]' : 'bg-emerald-400'}`} 
                    style={{ width: `${Math.max(0, remainingPercentage)}%` }} 
                  />
                </div>
                
                <div className="flex justify-between items-center text-[11px] font-medium pt-1 gap-2">
                  <span className="text-muted-foreground break-words">{tf(lang, 'table.sold', formatQty(qtySold), product.purchaseUnit)}</span>
                  <span className="text-foreground bg-surface border border-border/60 px-2.5 py-0.5 rounded-lg font-semibold shrink-0 text-[10px] sm:text-[11px] whitespace-nowrap">
                    {tf(lang, 'table.value', remainingValue.toLocaleString(undefined, { maximumFractionDigits: 0 }))}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Performance - 3 Column Fintech Tiles */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border/60 flex flex-col justify-between text-center min-w-0">
                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 leading-tight">{T('table.totalSales')}</div>
                <div className="font-extrabold text-[11px] sm:text-xs text-foreground break-words" title={totalRevenue > 0 ? `₦${totalRevenue.toLocaleString()}` : '-'}>
                  {totalRevenue > 0 ? `₦${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </div>
              </div>
              
              <div className="bg-surface/60 rounded-xl p-2.5 border border-border/60 flex flex-col justify-between text-center min-w-0">
                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 leading-tight">{T('table.goodsCost')}</div>
                <div className="font-extrabold text-[11px] sm:text-xs text-foreground break-words" title={goodsCost > 0 ? `₦${goodsCost.toLocaleString()}` : '-'}>
                  {goodsCost > 0 ? `₦${goodsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </div>
              </div>
              
              <div className={`rounded-xl p-2.5 border flex flex-col justify-between text-center min-w-0 ${totalRevenue === 0 ? 'bg-surface/60 border-border/60' : isLoss ? 'bg-rose-500/10 border-rose-500/20' : 'bg-sky-500/10 border-sky-500/20'}`}>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 leading-tight">{T('analysis.grossProfit')}</div>
                <div className={`font-extrabold text-[11px] sm:text-xs break-words ${totalRevenue === 0 ? 'text-foreground' : isLoss ? 'text-rose-400' : 'text-sky-400'}`} title={totalRevenue > 0 ? `₦${totalProfit.toLocaleString()}` : '-'}>
                  {totalRevenue > 0 ? `₦${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </div>
              </div>
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
