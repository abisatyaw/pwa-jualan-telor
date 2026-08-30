export interface DropdownOption {
  id: number;
  list_key: string;
  value: string;
}

export interface KgPerKarungRow {
  feed_type: string;
  value: number;
}

// ---------- Auth / Users ----------

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: UserRole;
}

// ---------- Asset ----------

export interface AssetInput {
  asset_name: string;
  asset_type: string;
  quantity: number;
  acquisition_price: number;
  acquisition_date: string;
  depreciation_months: number;
  chicken_group: string | null;
  chicken_age_weeks_at_purchase: number | null;
  notes: string | null;
}

export interface Asset extends AssetInput {
  id: number;
  created_at: string;
  updated_at: string;
  total_acquisition_value: number;
  monthly_depreciation: number;
  book_value: number;
  current_age_weeks: number | null;
}

// ---------- Production ----------

export interface ProductionInput {
  production_date: string;
  chicken_group: string;
  quantity_kg: number;
  average_egg_weight_kg: number | null;
  notes: string | null;
}

export interface Production extends ProductionInput {
  id: number;
  average_egg_weight_kg: number;
  estimated_egg_count: number;
  created_at: string;
  updated_at: string;
}

// ---------- Sale ----------

export type PaymentStatus = 'lunas' | 'hutang';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  lunas: 'Lunas',
  hutang: 'Hutang',
};

export interface SaleInput {
  sale_date: string;
  product_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  buyer_name: string;
  payment_status: PaymentStatus;
  paid_amount: number;
  notes: string | null;
}

export interface Sale extends SaleInput {
  id: number;
  total_price: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

// ---------- Transaction ----------

export interface TransactionInput {
  transaction_date: string;
  category: string;
  amount: number;
  qty: number | null;
  qty_unit: string | null;
  unit_price: number | null;
  feed_type: string | null;
  notes: string | null;
}

export interface Transaction extends TransactionInput {
  id: number;
  qty_per_group: number | null;
  created_at: string;
  updated_at: string;
}

// ---------- Debt ----------

export type DebtStatus = 'belum_lunas' | 'lunas';

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  belum_lunas: 'Belum Lunas',
  lunas: 'Lunas',
};

export interface DebtInput {
  lender_name: string;
  amount: number;
  loan_date: string;
  due_date: string | null;
  interest_rate: number;
  paid_amount: number;
  notes: string | null;
}

export interface Debt extends DebtInput {
  id: number;
  outstanding: number;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

// ---------- Dashboard ----------

export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ProductionTrendPoint {
  label: string;
  quantity_kg: number;
}

export interface ProductionWeekPoint {
  week_label: string;
  total_kg: number;
}

export interface ProductionSummary {
  total_kg: number;
  by_group: Record<string, number>;
  trend: ProductionTrendPoint[];
  weekly: ProductionWeekPoint[];
}

export interface WeeklyTransactionRow {
  week_label: string;
  category: string;
  amount: number;
}

export interface ReceivableRow {
  sale_id: number;
  sale_date: string;
  buyer_name: string;
  total_price: number;
  paid_amount: number;
  remaining_amount: number;
}

export interface EggPrice {
  source_key: string;
  label: string;
  url: string;
  price_text: string | null;
  price_value: number | null;
  status: 'ok' | 'failed' | 'pending';
  fetched_at: string | null;
}

export interface StockPosition {
  total_production_kg: number;
  total_purchased_kg: number;
  total_sold_kg: number;
  stock_kg: number;
  stock_kotak: number;
  egg_prices: EggPrice[];
}

export interface DashboardOverview {
  production: ProductionSummary;
  weekly_transactions: WeeklyTransactionRow[];
  receivables: ReceivableRow[];
  total_receivable: number;
  debts_outstanding: number;
  stock: StockPosition;
  expense_total: number;
  sales_total: number;
}
