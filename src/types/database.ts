export type AdminRole = "owner" | "admin";
export type GroupType = "shared" | "full";
export type GroupStatus = "active" | "full" | "suspended";
export type CustomerStatus = "active" | "expiring_soon" | "expired";
export type TransactionType = "income" | "expense";
export type TransactionCategory =
  | "new_order"
  | "renewal"
  | "account_cost"
  | "operational";
export type PaymentMethod = "QRIS" | "Transfer" | "Cash" | "Lainnya";

export interface AdminWhitelistRow {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
}

export interface FamilyGroupRow {
  id: string;
  group_name: string;
  manager_email: string;
  group_type: GroupType;
  max_slots: number;
  master_expired_at: string;
  status: GroupStatus;
  notes: string | null;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  full_name: string;
  whatsapp: string;
  gmail: string;
  family_group_id: string | null;
  package_name: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  customer_id: string | null;
  payment_method: PaymentMethod | null;
  description: string | null;
  transaction_date: string;
  recorded_by: string;
  created_at: string;
}

export interface FamilyGroupInsert {
  group_name: string;
  manager_email: string;
  group_type: GroupType;
  max_slots?: number;
  master_expired_at: string;
  status?: GroupStatus;
  notes?: string | null;
}

export type FamilyGroupUpdate = Partial<FamilyGroupInsert>;

export interface CustomerInsert {
  full_name: string;
  whatsapp: string;
  gmail: string;
  family_group_id?: string | null;
  package_name: string;
  start_date: string;
  end_date?: string;
  created_by?: string;
}

export type CustomerUpdate = Partial<Omit<CustomerInsert, "created_by">>;

export interface TransactionInsert {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  customer_id?: string | null;
  payment_method?: PaymentMethod | null;
  description?: string | null;
  transaction_date?: string;
  recorded_by?: string;
}

export type TransactionUpdate = Partial<Omit<TransactionInsert, "recorded_by">>;

export interface FamilyGroupWithSlots extends FamilyGroupRow {
  active_members_count: number;
  total_members_count: number;
  ready_slots: number;
  is_full: boolean;
  effective_status: GroupStatus;
}

export interface EnrichedCustomer extends CustomerRow {
  status: CustomerStatus;
  days_remaining: number;
  family_group_name: string | null;
  remind_wa_url: string;
}

export interface DuplicateGmailCheckResult {
  isDuplicate: boolean;
  matches: CustomerRow[];
  warningMessage: string | null;
}

export interface MonthlyFinanceSummary {
  income: number;
  expense: number;
  netProfit: number;
  count: number;
}

export interface MonthlyFinancePoint {
  month: number;
  label: string;
  income: number;
  expense: number;
  netProfit: number;
}

export interface MonthlyCustomerGrowthPoint {
  month: number;
  label: string;
  newCustomers: number;
  cumulativeCustomers: number;
}

export interface DashboardKpi {
  activeCustomers: number;
  totalReadySlots: number;
  expiringSoonCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNetProfit: number;
}

export interface DashboardData {
  year: number;
  month: number;
  kpi: DashboardKpi;
  customerGrowthSeries: MonthlyCustomerGrowthPoint[];
  financeSeries: MonthlyFinancePoint[];
  upcomingExpirations: EnrichedCustomer[];
}

export interface AuthSessionUser {
  email: string;
  name: string;
  role: AdminRole;
  mode: "dummy" | "supabase";
}
