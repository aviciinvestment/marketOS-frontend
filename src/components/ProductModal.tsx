import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export default function ProductModal({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialData: any; 
  onSave: (product: any) => void; 
}) {
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
    }
  }, [initialData]);

  if (!isOpen || !form) return null;

  const handleSave = () => {
    if (!form.name || !form.purchasePrice || !form.quantityPurchased || !form.purchaseUnit) {
      setError('Please fill out the basic product details (name, amount bought, cost).');
      return;
    }
    
    if (!form.sellingUnits || form.sellingUnits.length === 0) {
      setError('Please add at least one way you sell this item.');
      return;
    }
    
    for (let u of form.sellingUnits) {
      if (!u.name || !u.price || u.price <= 0) {
        setError(`Please check the details for how you sell as "${u.name || 'a unit'}". Ensure the selling price is correct.`);
        return;
      }
    }
    // A blank/zero "how many you can get" must never silently zero out cost.
    // Default it to the number of purchase units bought so the cost of goods
    // sold can always be derived. The user can edit it to the true yield later.
    const defaultYield = form.quantityPurchased || 1;
    const sellingUnits = form.sellingUnits.map((u: any) => {
      const y = Number(u.yieldFromTotal);
      const yieldFromTotal = y > 0 ? y : defaultYield;
      return u.yieldFromTotal === yieldFromTotal ? u : { ...u, yieldFromTotal };
    });
    setError('');
    onSave({ ...form, sellingUnits });
  };

  const addSellingUnit = () => {
    setForm({
      ...form,
      sellingUnits: [
        ...(form.sellingUnits || []),
        { id: Date.now().toString(), name: '', yieldFromTotal: form.quantityPurchased || 1, price: '' }
      ]
    });
  };

  const updateSellingUnit = (id: string, field: string, value: any) => {
    setForm({
      ...form,
      sellingUnits: form.sellingUnits.map((u: any) => 
        u.id === id ? { ...u, [field]: value } : u
      )
    });
  };

  const removeSellingUnit = (id: string) => {
    setForm({
      ...form,
      sellingUnits: form.sellingUnits.filter((u: any) => u.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="bg-card w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-border/50 relative z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 block">
              {initialData?.name ? 'Edit Stock' : 'New Stock'}
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {initialData?.name ? 'Edit Item' : 'Add New Item to Stock'}
            </h2>
          </div>
          
          <div className="space-y-7">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* 1. What product are you adding? */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs">1</div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">What product are you adding?</h3>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Item Name</label>
                <input 
                  value={form.name || ''}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:border-amber-400 font-bold transition-colors"
                  placeholder="e.g. Kings Cooking Oil"
                />
              </div>
            </div>

            {/* 2. How did you buy it? */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs">2</div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">How did you buy it?</h3>
              </div>
              
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Quantity Bought</label>
                  <input 
                    type="number"
                    value={form.quantityPurchased || ''}
                    onChange={(e) => setForm({...form, quantityPurchased: parseFloat(e.target.value) || 0})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-bold text-sm transition-colors"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Bought as</label>
                  <input 
                    value={form.purchaseUnit || ''}
                    onChange={(e) => setForm({...form, purchaseUnit: e.target.value})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-bold text-sm transition-colors"
                    placeholder="e.g. Litres, Bags"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Total Cost (₦)</label>
                  <input 
                    type="number"
                    value={form.purchasePrice || ''}
                    onChange={(e) => setForm({...form, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-black text-sm transition-colors"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>
            </div>

            {/* 3. How do you normally sell it? */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs">3</div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">How do you normally sell it?</h3>
                </div>
                <button 
                  onClick={addSellingUnit} 
                  className="pill-button text-xs font-extrabold bg-[#F5C518] text-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Way to Sell
                </button>
              </div>
              
              <div className="space-y-3.5">
                {form.sellingUnits && form.sellingUnits.map((unit: any) => {
                  const costPerItem = (unit.yieldFromTotal || 0) > 0 ? (form.purchasePrice || 0) / unit.yieldFromTotal : 0;
                  const profitPerItem = (unit.price || 0) - costPerItem;
                  const isLoss = (unit.yieldFromTotal || 0) > 0 && (unit.price || 0) > 0 && profitPerItem < 0;

                  return (
                    <div key={unit.id} className="bg-surface/50 p-5 rounded-xl border border-border/50 relative">
                      <button 
                        onClick={() => removeSellingUnit(unit.id)} 
                        className="absolute top-4 right-4 text-muted-foreground hover:text-rose-400 transition-colors w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-10">
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Sold as (e.g. Cup, Bottle)</label>
                          <input 
                            value={unit.name}
                            onChange={(e) => updateSellingUnit(unit.id, 'name', e.target.value)}
                            className="w-full bg-card border border-border/50 rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-amber-400 text-sm font-bold transition-colors"
                            placeholder="e.g. Cup"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Selling price for 1 {unit.name || 'unit'}</label>
                          <input 
                            type="number"
                            value={unit.price || ''}
                            onChange={(e) => updateSellingUnit(unit.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-card border border-border/50 rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-amber-400 text-sm font-bold transition-colors"
                            placeholder="₦"
                          />
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border ${isLoss ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface/80 border-border/40'}`}>
                        <label className={`block text-xs font-semibold mb-2.5 ${isLoss ? 'text-rose-400' : 'text-muted-foreground'}`}>
                          (Optional) How many {unit.name || 'units'} can you get from what you bought?
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">I can get exactly</span>
                          <input 
                            type="number" 
                            value={unit.yieldFromTotal || ''}
                            onChange={(e) => updateSellingUnit(unit.id, 'yieldFromTotal', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-card border border-border/50 rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:border-amber-400 text-center font-black text-sm"
                            placeholder="All"
                          />
                          <span className="text-xs font-medium text-muted-foreground">{unit.name || 'units'} in total.</span>
                        </div>
                        
                        {unit.yieldFromTotal > 0 && unit.price > 0 && form.purchasePrice > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50 text-xs flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div className="flex gap-2 items-center">
                              <span className="text-muted-foreground">Cost per {unit.name || 'unit'}:</span>
                              <span className="font-extrabold text-foreground">₦{(form.purchasePrice / unit.yieldFromTotal).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-muted-foreground">Profit per {unit.name || 'unit'}:</span>
                              <span className={`font-extrabold ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {isLoss ? '' : '+'}₦{(unit.price - (form.purchasePrice / unit.yieldFromTotal)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {(!form.sellingUnits || form.sellingUnits.length === 0) && (
                  <div className="text-center p-7 border-2 border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground text-xs mb-3 font-medium">You haven't added any ways to sell this item yet.</p>
                    <button onClick={addSellingUnit} className="pill-button text-xs font-extrabold bg-[#F5C518] text-black px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Add Way to Sell
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-5 border-t border-border/60">
            <button 
              onClick={onClose}
              className="pill-button flex-1 py-3.5 rounded-full border border-border text-foreground font-bold hover:bg-surface transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="pill-button flex-1 py-3.5 rounded-full bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold transition-all shadow-xl shadow-amber-500/15 text-sm"
            >
              Save Item
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
