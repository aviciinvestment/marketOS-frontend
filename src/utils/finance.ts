import type { SaleTransaction, BusinessExpense, Product } from '../types';

export interface FinancialSummary {
  totalSales: number;
  totalGoodsCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

/**
 * Calculates a consolidated financial summary for any given set of sales, expenses
 * and products. This ensures the exact same logic is used across the Dashboard,
 * Insights, and Products tables.
 *
 * The profit model is "payback / break-even":
 *   - Money Made   = sum of all customer revenue (that is the only thing a sale adds)
 *   - Goods Cost   = total purchase cost of the products whose sales appear here
 *   - Gross Profit = Money Made - Goods Cost
 *   - Expenses     = sum of business spending (never touches sales/Goods Cost)
 *   - Net Profit   = Gross Profit - Expenses
 *
 * So a product starts in the red (Money Made < what it cost you) and only shows a
 * positive profit once the money made from it has covered its purchase price.
 */
export function calculateFinancials(
  sales: SaleTransaction[] = [],
  expenses: BusinessExpense[] = [],
  products: Product[] = []
): FinancialSummary {
  // 1. TOTAL SALES (Money Made): Sum of all revenue from customers
  const revenueOf = (sale: SaleTransaction) => sale.totalRevenue || sale.amount || 0;
  const totalSales = sales.reduce((acc, sale) => acc + revenueOf(sale), 0);

  // 2. TOTAL GOODS COST: the full purchase price of every product that was sold
  //    in the given set of sales. A product with no sales here does not drag the
  //    period down; whether you've earned back its cost shows once it sells.
  const soldProductIds = new Set(
    sales.filter(sale => revenueOf(sale) > 0 && sale.productId).map(sale => sale.productId)
  );
  const totalGoodsCost = products.reduce((acc, product) =>
    soldProductIds.has(product.id) ? acc + (product.purchasePrice || 0) : acc
  , 0);

  // 3. GROSS PROFIT: Money Made - cost of the goods
  const grossProfit = totalSales - totalGoodsCost;

  // 4. TOTAL EXPENSES: Sum of recorded business expenses
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  // 5. NET PROFIT: Gross Profit - Total Expenses
  const netProfit = grossProfit - totalExpenses;

  return {
    totalSales,
    totalGoodsCost,
    grossProfit,
    totalExpenses,
    netProfit
  };
}

/** Revenue a single sale contributed. */
export function saleRevenue(sale: SaleTransaction): number {
  return sale.totalRevenue || sale.amount || 0;
}

/** Payback numbers for one product: money made vs what it cost. */
export function productFinancials(product: Product, sales: SaleTransaction[]) {
  const moneyMade = sales
    .filter(sale => sale.productId === product.id)
    .reduce((acc, sale) => acc + saleRevenue(sale), 0);
  const goodsCost = product.purchasePrice || 0;
  return { moneyMade, goodsCost, profit: moneyMade - goodsCost };
}

/**
 * A product has only truly "finished"/paid for itself once the money made from
 * it covers its purchase cost. Until then it is still being paid back.
 */
export function isPaidBack(product: Product, sales: SaleTransaction[]): boolean {
  const { moneyMade, goodsCost } = productFinancials(product, sales);
  return moneyMade >= goodsCost;
}

/**
 * Stock picture for a product, derived from money made vs its purchase cost.
 * A product's stock reduces little by little as its money is recouped and is
 * only exhausted once the total cost has been covered (i.e. it paid for itself).
 * Selling pieces from a bag therefore lowers the bag stock a fraction at a time
 * instead of jumping straight from full to empty.
 */
export function stockOf(product: Product, sales: SaleTransaction[]) {
  const { moneyMade, goodsCost } = productFinancials(product, sales);
  const fractionConsumed = goodsCost > 0 ? Math.min(1, moneyMade / goodsCost) : 0;
  const quantity = product.quantityPurchased || 0;
  return {
    moneyMade,
    goodsCost,
    fractionConsumed,
    qtySold: quantity * fractionConsumed,
    qtyRemaining: Math.max(0, quantity * (1 - fractionConsumed)),
    remainingPercentage: Math.max(0, (1 - fractionConsumed) * 100),
    remainingValue: Math.max(0, goodsCost * (1 - fractionConsumed))
  };
}