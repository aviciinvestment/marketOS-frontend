import { TrendingDown, Edit, Trash2 } from 'lucide-react';
import type { BusinessExpense } from '../types';

export default function ExpenseList({ 
  expenses,
  onEdit,
  onDelete
}: { 
  expenses: BusinessExpense[];
  onEdit: (expense: BusinessExpense) => void;
  onDelete: (id: string) => void;
}) {
  if (expenses.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/50 text-center shadow-sm">
        <p className="text-sm text-muted-foreground font-medium">No expenses recorded yet. Tap "Record Money Spent" to log one.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-extrabold text-foreground text-lg flex items-center gap-2 tracking-tight">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            Operating Expenses
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Costs logged outside product purchases</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {expenses.map(expense => (
          <div 
            key={expense.id} 
            className="flex justify-between items-center p-3 sm:p-3.5 rounded-xl bg-surface/40 hover:bg-surface border border-border/40 hover:border-border/70 transition-all min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <div className="font-bold text-foreground text-sm truncate">{expense.category || 'Expense'}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {expense.description || new Date(expense.date).toLocaleDateString()}
                  {expense.description ? ` · ${new Date(expense.date).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="font-extrabold text-amber-400 text-sm sm:text-base">
                -₦{(expense.amount || 0).toLocaleString()}
              </span>
              <button 
                onClick={() => onEdit(expense)} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors" 
                title="Edit expense"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDelete(expense.id)} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 flex items-center justify-center transition-colors" 
                title="Delete expense"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}