import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAppT, useAppLang, tf } from '../i18n';

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
  const T = useAppT();
  const lang = useAppLang();

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
    }
  }, [initialData]);

  if (!isOpen || !form) return null;

  const unitFallback = T('product.soldAsExample');

  const handleSave = () => {
    if (!form.name || !form.purchasePrice || !form.quantityPurchased || !form.purchaseUnit) {
      setError(T('product.errBasic'));
      return;
    }
    
    if (!form.sellingUnits || form.sellingUnits.length === 0) {
      setError(T('product.errNoWays'));
      return;
    }
    
    for (let u of form.sellingUnits) {
      if (!u.name || !u.price || u.price <= 0) {
        setError(tf(lang, 'product.errWay', u.name || unitFallback));
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
        { id: Date.now().toString(), name: '', yieldFromTotal: 0, price: '' }
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
              {initialData?.name ? T('product.editChip') : T('product.newChip')}
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {initialData?.name ? T('product.editTitle') : T('product.newTitle')}
            </h2>
          </div>
          
          <div className="space-y-7">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* 1. What is the name of the item? */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm">1</div>
                <h3 className="text-sm font-extrabold text-foreground">{T('product.sec1Title')}</h3>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('product.nameLabel')}</label>
                <input 
                  value={form.name || ''}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:border-amber-400 font-bold transition-colors"
                  placeholder={T('product.namePlaceholder')}
                />
              </div>
            </div>

            {/* 2. What did you pay? */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm">2</div>
                <h3 className="text-sm font-extrabold text-foreground">{T('product.sec2Title')}</h3>
              </div>
              
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('product.qtyLabel')}</label>
                  <input 
                    type="number"
                    value={form.quantityPurchased || ''}
                    onChange={(e) => setForm({...form, quantityPurchased: parseFloat(e.target.value) || 0})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-bold text-sm transition-colors"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('product.boughtAsLabel')}</label>
                  <input 
                    value={form.purchaseUnit || ''}
                    onChange={(e) => setForm({...form, purchaseUnit: e.target.value})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-bold text-sm transition-colors"
                    placeholder={T('product.boughtAsPlaceholder')}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{T('product.boughtAsHint')}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{T('product.totalCostLabel')}</label>
                  <input 
                    type="number"
                    value={form.purchasePrice || ''}
                    onChange={(e) => setForm({...form, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-black text-sm transition-colors"
                    placeholder={T('product.totalCostPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* 3. How do you sell it to customers? */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm">3</div>
                  <h3 className="text-sm font-extrabold text-foreground">{T('product.sec3Title')}</h3>
                </div>
                <button 
                  onClick={addSellingUnit} 
                  className="pill-button text-xs font-extrabold bg-[#F5C518] text-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> {T('product.addWay')}
                </button>
              </div>
              
              <div className="space-y-3.5">
                {form.sellingUnits && form.sellingUnits.map((unit: any) => {
                  const unitName = unit.name || unitFallback;
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
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{T('product.soldAsLabel')}</label>
                          <input 
                            value={unit.name}
                            onChange={(e) => updateSellingUnit(unit.id, 'name', e.target.value)}
                            className="w-full bg-card border border-border/50 rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-amber-400 text-sm font-bold transition-colors"
                            placeholder={T('product.soldAsPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{tf(lang, 'product.priceLabel', unitName)}</label>
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
                        <label className={`block text-xs font-bold mb-2.5 ${isLoss ? 'text-rose-400' : 'text-foreground'}`}>
                          {tf(lang, 'product.yieldLabel', unitName)}
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">{tf(lang, 'product.yieldPrefix')}</span>
                          <input 
                            type="number" 
                            value={unit.yieldFromTotal || ''}
                            onChange={(e) => updateSellingUnit(unit.id, 'yieldFromTotal', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-card border border-border/50 rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:border-amber-400 text-center font-black text-sm"
                            placeholder={T('product.yieldPlaceholder')}
                          />
                          <span className="text-xs font-medium text-muted-foreground">{tf(lang, 'product.yieldTotal', unitName)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">{tf(lang, 'product.yieldHint', unitName)}</p>
                        
                        {unit.yieldFromTotal > 0 && unit.price > 0 && form.purchasePrice > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center justify-between gap-2 bg-card rounded-xl px-3 py-2 border border-border/40">
                              <span className="text-xs font-semibold text-muted-foreground">{tf(lang, 'product.costPer', unitName)}:</span>
                              <span className="font-extrabold text-foreground">₦{(form.purchasePrice / unit.yieldFromTotal).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-card rounded-xl px-3 py-2 border border-border/40">
                              <span className="text-xs font-semibold text-muted-foreground">{tf(lang, 'product.profitPer', unitName)}:</span>
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
                    <p className="text-muted-foreground text-xs mb-3 font-medium">{T('product.noWays')}</p>
                    <button onClick={addSellingUnit} className="pill-button text-xs font-extrabold bg-[#F5C518] text-black px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> {T('product.addWay')}
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
              {T('product.cancel')}
            </button>
            <button 
              onClick={handleSave}
              className="pill-button flex-1 py-3.5 rounded-full bg-[#F5C518] hover:bg-[#EAB308] text-black font-extrabold transition-all shadow-xl shadow-amber-500/15 text-sm"
            >
              {initialData?.name ? T('product.saveEdit') : T('product.saveNew')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}