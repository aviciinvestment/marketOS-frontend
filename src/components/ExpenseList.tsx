import { useState } from 'react';
import { TrendingDown, Edit2, Trash2, Plus } from 'lucide-react';
import type { BusinessExpense } from '../types';
import AlertDialog from './ui/AlertDialog';
import { useAppT, useAppLang, tf } from '../i18n';

export default function ExpenseList({ 
  expenses,
  deviceId,
  onEdit,
  onDelete,
  onAdd
}: { 
  expenses: BusinessExpense[];
  deviceId?: string;
  onEdit: (expense: BusinessExpense) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}) {
  const [expenseToDelete, setExpenseToDelete] = useState<BusinessExpense | null>(null);
  const T = useAppT();
  const lang = useAppLang();

  return (
    <div className="bg-card -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full rounded-none sm:rounded-2xl p-4 sm:p-6 border-y sm:border border-border/50 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">{T('expense.title')}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              {T('expense.badge')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{T('expense.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {expenses.length > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {expenses.length} {expenses.length === 1 ? 'Expense' : 'Expenses'}
            </span>
          )}
          {onAdd && (
            <button 
              onClick={onAdd}
              className="pill-button flex items-center justify-center gap-1.5 bg-[#F5C518] hover:bg-[#EAB308] text-black px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/15 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{T('expense.record')}</span>
            </button>
          )}
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground bg-surface/30 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-2">
          <TrendingDown className="w-7 h-7 text-muted-foreground/40" />
          <p className="font-semibold text-foreground/80">{T('expense.emptyTitle')}</p>
          <p className="text-muted-foreground">{T('expense.emptyDesc')}</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-1 px-3.5 py-1.5 bg-surface hover:bg-surface-hover border border-amber-400/40 text-amber-400 font-extrabold text-xs rounded-lg transition-colors"
            >
              + {T('expense.record')}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-0.5">
          {expenses.slice(0, 20).map(expense => {
            const isThisDevice = expense.updatedByDevice ? expense.updatedByDevice === deviceId : false;
            return (
              <div 
                key={expense.id} 
                className="flex justify-between items-center p-3 sm:p-3.5 rounded-xl bg-surface/40 hover:bg-surface border border-border/50 hover:border-border transition-all min-w-0 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-foreground text-xs sm:text-sm truncate flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span>{expense.category || 'Expense'}</span>
                      {expense.updatedByDevice ? (
                        isThisDevice ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            This device
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            Another device
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {expense.description ? `${expense.description} · ` : ''}
                      {new Date(expense.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-extrabold text-amber-400 text-xs sm:text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap">
                    -₦{(expense.amount || 0).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => onEdit(expense)} 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors" 
                    title={T('expense.editTooltip')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setExpenseToDelete(expense)} 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 flex items-center justify-center transition-colors" 
                    title={T('expense.deleteTooltip')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog
        isOpen={!!expenseToDelete}
        title={T('expense.deleteTitle')}
        description={
          expenseToDelete 
            ? tf(lang, 'expense.deleteDesc', (expenseToDelete.amount || 0).toLocaleString(), expenseToDelete.category || '')
            : T('expense.deleteDescFallback')
        }
        type="danger"
        confirmText={T('expense.yesDelete')}
        cancelText={T('action.cancel')}
        onConfirm={() => {
          if (expenseToDelete) {
            onDelete(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}