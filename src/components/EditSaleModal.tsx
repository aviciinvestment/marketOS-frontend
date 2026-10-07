import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingBag, Trash2 } from 'lucide-react';

interface EditSaleModalProps {
  isOpen: boolean;
  sale: any;
  onClose: () => void;
  onSave: (updatedSale: any) => void;
  onDelete?: (saleId: string) => void;
}

export default function EditSaleModal({
  isOpen,
  sale,
  onClose,
  onSave,
  onDelete
}: EditSaleModalProps) {
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [unitName, setUnitName] = useState<string>('Piece');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    if (isOpen && sale) {
      setQuantity(String(sale.quantitySold || 1));
      setUnitPrice(String(sale.sellingPricePerUnit || (sale.totalRevenue && sale.quantitySold ? Math.round(sale.totalRevenue / sale.quantitySold) : 0)));
      setUnitName(sale.unitName || 'Piece');
      if (sale.timestamp) {
        try {
          const d = new Date(sale.timestamp);
          setDateStr(d.toISOString().slice(0, 16));
        } catch {
          setDateStr('');
        }
      }
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const qtyNum = Math.max(1, parseInt(quantity) || 1);
  const priceNum = Math.max(0, parseFloat(unitPrice) || 0);
  const totalRevenue = qtyNum * priceNum;

  const handleSave = () => {
    const updated = {
      ...sale,
      quantitySold: qtyNum,
      sellingPricePerUnit: priceNum,
      unitName: unitName.trim() || 'Piece',
      totalRevenue,
      timestamp: dateStr ? new Date(dateStr).toISOString() : sale.timestamp,
      updatedAt: Date.now()
    };
    onSave(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Edit Sale Record</h3>
                <p className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
                  {sale.productName || 'Sale Entry'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-4">
            {/* Quantity */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Quantity Sold
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {/* Selling Unit Name */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Selling Unit
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g. Piece, Bag, Kg, Cup"
                className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {/* Price per unit */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Price Per {unitName || 'Unit'} (₦)
              </label>
              <input
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {/* Total Revenue Preview Card */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Calculated Revenue
                </span>
                <span className="text-xs text-muted-foreground">
                  {qtyNum} × ₦{priceNum.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-amber-400">
                  ₦{totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Date / Time */}
            {dateStr && (
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Sale Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-surface border border-border/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-border/60 bg-surface/30 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete sale of ${sale.productName || 'this item'}?`)) {
                    onDelete(sale.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Sale</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface border border-border/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5C518] hover:bg-[#EAB308] text-black shadow-md shadow-amber-500/20 transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
