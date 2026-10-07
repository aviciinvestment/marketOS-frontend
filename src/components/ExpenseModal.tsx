import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { BusinessExpense } from '../types';

export default function ExpenseModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialExpense = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (expense: BusinessExpense) => void;
  initialExpense?: BusinessExpense | null;
}) {
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialExpense?.category || 'Rent');
      setAmount(initialExpense ? String(initialExpense.amount || 0) : '');
      setDescription(initialExpense?.description || '');
      setDate(initialExpense?.date ? initialExpense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialExpense]);

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    const expense: BusinessExpense = {
      id: initialExpense?.id || Date.now().toString(),
      category,
      amount: parseFloat(amount),
      description,
      date: new Date(date).toISOString()
    };
    
    onSave(expense);
    
    // Reset form
    setCategory('Rent');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const categories = ["Transport", "Electricity", "Rent", "Packaging", "Staff", "Delivery", "Other"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="bg-card w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-border/50 relative z-10 flex flex-col max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 block">
                  {initialExpense ? 'Update' : 'New Expense'}
                </span>
                <h4 className="font-extrabold text-xl text-foreground tracking-tight">
                  {initialExpense ? 'Edit Expense' : 'Record Money Spent'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">Separate from buying goods (transport, rent, fuel)</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 rounded-full bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(c => {
                    const isSelected = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`pill-button py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center truncate ${
                          isSelected
                            ? 'bg-[#F5C518] text-black border-[#F5C518] shadow-sm'
                            : 'bg-surface/50 border-border text-muted-foreground hover:text-foreground hover:bg-surface'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  How much did you spend?
                </label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-amber-400 font-extrabold text-lg">₦</span>
                  </div>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface border border-border/50 rounded-xl pl-10 pr-4 py-3.5 text-foreground focus:outline-none focus:border-amber-400 font-black text-xl transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Date
                </label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 font-medium text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Note / Reason (Optional)
                </label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Paid okada for warehouse run"
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-amber-400 text-sm transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0}
              className="pill-button w-full text-base font-extrabold py-4 rounded-full transition-all shadow-xl shadow-amber-500/15 mt-7 flex items-center justify-center gap-2 bg-[#F5C518] hover:bg-[#EAB308] text-black disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              {initialExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

