import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Package, RefreshCw } from 'lucide-react';


export default function SaleModal({ 
  isOpen, 
  product, 
  sales,
  onClose, 
  onRecordSale 
}: { 
  isOpen: boolean; 
  product: any; 
  sales?: any[];
  onClose: () => void; 
  onRecordSale: (sale: any) => void;
}) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [price, setPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      if (product.sellingUnits && product.sellingUnits.length > 0) {
        setSelectedUnitId(product.sellingUnits[0].id);
      }
      setQuantity('1');
      setPrice('');
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Fallback for old products that don't have the new schema
  const isOldProduct = !product.sellingUnits;
  const activeUnit = isOldProduct 
    ? { id: 'old', name: 'Unit', price: product.price || 0, yieldFromTotal: product.stock || 1 }
    : product.sellingUnits.find((u: any) => u.id === selectedUnitId) || product.sellingUnits[0];

  const qtyNum = parseInt(quantity) || 0;
  // Custom price support: a seller can type any price for this sale; leaving it
  // blank falls back to the unit's normal selling price.
  const unitPrice = activeUnit.price || 0;
  const priceNum = price !== '' && Number(price) > 0 ? Number(price) : unitPrice;
  const revenue = qtyNum * priceNum;
  const goodsCost = product.purchasePrice || 0;

  // Money made so far on this product (fresh sales + the one being recorded).
  const priorRevenue = (sales || []).filter(s => s.productId === product.id)
    .reduce((acc: number, s: any) => acc + (s.totalRevenue || s.amount || 0), 0);
  const moneyMadeSoFar = priorRevenue + revenue;
  const runningProfit = moneyMadeSoFar - goodsCost;

  // Stock reduces little by little as money comes in and is only exhausted once
  // the total cost is covered. A "piece" therefore lowers a bag a fraction at a
  // time instead of emptying it.
  const fractionAfter = goodsCost > 0 ? Math.min(1, moneyMadeSoFar / goodsCost) : 0;
  const remainingQty = Math.max(0, (product.quantityPurchased || 0) * (1 - fractionAfter));

  const handleRecord = () => {
    if (qtyNum <= 0) return;
    
    setIsSubmitting(true);

    const newSale = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      unitId: activeUnit.id,
      unitName: activeUnit.name,
      quantitySold: qtyNum,
      sellingPricePerUnit: priceNum,
      customPrice: priceNum !== unitPrice,
      totalRevenue: revenue,
      fractionOfTotalSold: goodsCost > 0 ? Math.min(1, revenue / goodsCost) : 0,
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Wait for user to click "Done" instead of auto-closing immediately, 
      // or we can auto-close after a few seconds but give them time to read.
      onRecordSale(newSale);
    }, 600);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="bg-card w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-border/50 relative z-10 flex flex-col max-h-[90vh] overflow-y-auto"
        >
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">Sale Recorded!</h3>
              <p className="text-muted-foreground text-xs mb-6">Stock and financials updated immediately.</p>
              
              <div className="bg-surface/70 rounded-xl p-5 text-left space-y-3.5 mb-7 border border-border/40">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Money Received</span>
                  <span className="text-xl font-black text-foreground">₦{revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity Sold</span>
                  <span className="font-bold text-foreground text-sm">{qtyNum} {activeUnit.name}{qtyNum > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit so far on {product.name}</span>
                  <span className={`font-bold text-sm ${runningProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₦{runningProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining Stock</span>
                  <span className="font-bold text-foreground text-sm">
                    {remainingQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {product.purchaseUnit || 'units'} left
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleClose}
                className="pill-button w-full bg-white hover:bg-zinc-200 text-black font-extrabold py-4 rounded-full transition-all shadow-lg text-base"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 block">New Sale</span>
                  <h4 className="font-extrabold text-xl text-foreground tracking-tight">{product.name}</h4>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-6">
                {!isOldProduct && (
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">Select Unit Sold</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {product.sellingUnits.map((unit: any) => (
                        <button
                          key={unit.id}
                          onClick={() => { setSelectedUnitId(unit.id); setPrice(''); }}
                          className={`pill-button p-3.5 rounded-xl border text-left transition-all ${
                            selectedUnitId === unit.id 
                              ? 'border-[#F5C518] bg-[#F5C518]/10 text-foreground ring-1 ring-[#F5C518]' 
                              : 'border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className="font-bold text-sm mb-0.5 truncate">{unit.name}</div>
                          <div className="text-xs text-amber-400 font-extrabold">₦{unit.price.toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Selling Price</label>
                  <div className="flex items-center bg-surface/50 rounded-xl border border-border/50 overflow-hidden focus-within:border-amber-400 transition-colors">
                    <span className="pl-4 py-3 text-xs font-extrabold text-muted-foreground">₦</span>
                    <input 
                      type="number" 
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={unitPrice.toLocaleString()}
                      className="flex-1 bg-transparent px-2 py-3 text-sm font-bold focus:outline-none text-foreground"
                    />
                  </div>
                  {price !== '' && Number(price) > 0 && (
                    <p className="text-[10px] text-amber-400 font-bold mt-1.5">
                      Custom price — {unitPrice > 0 ? `unit price is ₦${unitPrice.toLocaleString()}` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">Quantity</label>
                  <div className="flex items-center gap-3 bg-surface/50 p-2 rounded-xl border border-border/50">
                    <button 
                      onClick={() => setQuantity(Math.max(1, qtyNum - 1).toString())}
                      className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-xl font-bold hover:bg-surface transition-colors text-foreground shadow-sm"
                    >-</button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 bg-transparent px-2 h-12 text-center font-black text-3xl focus:outline-none text-foreground"
                    />
                    <button 
                      onClick={() => setQuantity((qtyNum + 1).toString())}
                      className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-xl font-bold hover:bg-surface transition-colors text-foreground shadow-sm"
                    >+</button>
                  </div>
                </div>

                {/* Review Transaction Card (Image 1 style) */}
                <div className="bg-surface/70 rounded-xl p-4 sm:p-5 border border-border/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Money Received</span>
                    <span className="text-2xl font-black text-foreground">₦{revenue.toLocaleString()}</span>
                  </div>
                  {product.purchasePrice > 0 && (
                    <div className="flex justify-between items-center pt-2.5 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-medium">Profit so far on {product.name}</span>
                      <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${
                        runningProfit < 0 ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        ₦{runningProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleRecord}
                disabled={qtyNum <= 0 || isSubmitting}
                className="pill-button w-full text-base font-extrabold py-4 rounded-full transition-all shadow-xl shadow-amber-500/15 mt-6 flex items-center justify-center gap-2 bg-[#F5C518] hover:bg-[#EAB308] text-black disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  'Record Sale'
                )}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
