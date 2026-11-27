import type {
  CustomerRow,
  DashboardData,
  FamilyGroupRow,
  TransactionRow,
} from "@/types/database";
import {
  enrichCustomer,
  getTodayDateString,
  getUpcomingExpirations,
} from "@/lib/logic/customer";
import {
  buildMonthlyCustomerGrowthSeries,
  buildMonthlyFinanceSeries,
  calculateMonthlyFinanceSummary,
} from "@/lib/logic/finance";
import { calculateTotalReadySlots } from "@/lib/logic/slots";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface DashboardQueryParams {
  year?: number;
  month?: number;
  today?: string;
}

/**
 * Mengambil & mengagregasi seluruh metrik Dashboard Utama:
 * KPI Cards, Grafik Kenaikan Pelanggan, Grafik Keuangan, dan 5 Jatuh Tempo Terdekat.
 */
export async function getDashboardData(
  params?: DashboardQueryParams,
): Promise<DashboardData> {
  const today = params?.today ?? getTodayDateString();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const year = params?.year ?? currentYear;
  const month = params?.month ?? currentMonth;

  const supabase = createSupabaseBrowserClient();

  const [groupsRes, customersRes, transactionsRes] = await Promise.all([
    supabase.from("family_groups").select("*"),
    supabase.from("customers").select("*"),
    supabase.from("transactions").select("*"),
  ]);

  if (groupsRes.error) {
    throw new Error(groupsRes.error.message);
  }
  if (customersRes.error) {
    throw new Error(customersRes.error.message);
  }
  if (transactionsRes.error) {
    throw new Error(transactionsRes.error.message);
  }

  const groups = (groupsRes.data ?? []) as FamilyGroupRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];
  const transactions = (transactionsRes.data ?? []) as TransactionRow[];

  const groupNameById: Record<string, string> = {};
  for (const group of groups) {
    groupNameById[group.id] = group.group_name;
  }

  const enrichedCustomers = customers.map((customer) =>
    enrichCustomer(customer, groupNameById, today),
  );

  const activeCustomers = enrichedCustomers.filter(
    (customer) => customer.status !== "expired",
  ).length;

  const expiringSoonCount = enrichedCustomers.filter(
    (customer) => customer.status === "expiring_soon",
  ).length;

  const totalReadySlots = calculateTotalReadySlots(groups, customers, today);
  const monthlyFinance = calculateMonthlyFinanceSummary(
    transactions,
    year,
    month,
  );

  return {
    year,
    month,
    kpi: {
      activeCustomers,
      totalReadySlots,
      expiringSoonCount,
      monthlyIncome: monthlyFinance.income,
      monthlyExpense: monthlyFinance.expense,
      monthlyNetProfit: monthlyFinance.netProfit,
    },
    customerGrowthSeries: buildMonthlyCustomerGrowthSeries(customers, year),
    financeSeries: buildMonthlyFinanceSeries(transactions, year),
    upcomingExpirations: getUpcomingExpirations(
      customers,
      5,
      today,
      groupNameById,
    ),
  };
}
