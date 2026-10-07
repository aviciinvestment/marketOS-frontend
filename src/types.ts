export interface SellingUnit {
  id: string;
  name: string; // e.g., "Cup", "Bottle", "Piece"
  quantityEquivalent: number; // How many of this unit make up 1 Purchase Unit? (e.g., if 1 Purchase Unit = 25 Liters, and 1 Cup = 0.25 Liters, then quantityEquivalent = 0.01 Purchase Units). Or simpler: How many of this unit can you get from the TOTAL quantity purchased? Let's use `yieldFromTotal` for simplicity.
  yieldFromTotal: number; // If I buy 1 sack, and can get 100 cups from it, yieldFromTotal = 100.
  price: number; // Selling price per unit
}

export interface Product {
  id: string;
  name: string;
  category: string;
  
  // Purchase details
  purchasePrice: number; // Total cost for the bulk purchase
  quantityPurchased: number; // E.g., 25
  purchaseUnit: string; // E.g., "Litres", "Bags", "Cartons"
  datePurchased: string; // ISO string
  supplierInfo?: string;
  notes?: string;

  // Selling details
  sellingUnits: SellingUnit[];
  
  // Tracking (Calculated based on sales, but keeping a base tracking metric is good)
  // We can track the "fraction" of the total bulk consumed. 1.0 means fully sold out.
  fractionConsumed: number; 

  status: "Active" | "Draft" | "Archived";
  views?: number;
}

export interface SaleTransaction {
  id: string;
  productId: string;
  productName: string;
  
  // What was sold
  unitId: string;
  unitName: string;
  quantitySold: number;
  
  // Financials
  sellingPricePerUnit: number;
  totalRevenue: number;
  amount?: number; // Legacy fallback for older sale records without totalRevenue
  
  // Fraction of the total purchase consumed by this sale (used for stock tracking)
  fractionOfTotalSold: number; // (quantitySold / yieldFromTotal)
  
  timestamp: string; // ISO string
}

export interface BusinessExpense {
  id: string;
  category: string; // "Transportation", "Rent", "Electricity", etc.
  amount: number;
  description: string;
  date: string; // ISO string
}
