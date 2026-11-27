import type {
  CustomerRow,
  DashboardData,
  EnrichedCustomer,
  FamilyGroupRow,
  FamilyGroupWithSlots,
  TransactionRow,
} from "@/types/database";
import {
  addDaysToDateString,
  enrichCustomer,
  getTodayDateString,
  getUpcomingExpirations,
} from "@/lib/logic/customer";
import {
  buildMonthlyCustomerGrowthSeries,
  buildMonthlyFinanceSeries,
  calculateMonthlyFinanceSummary,
} from "@/lib/logic/finance";
import {
  calculateGroupSlotInfo,
  calculateTotalReadySlots,
} from "@/lib/logic/slots";

/**
 * Menyediakan data dummy realistis sesuai PRD ketika Supabase lokal belum diisi,
 * sehingga Arya & tim dapat langsung berinteraksi penuh dengan seluruh halaman UI.
 */
export function buildDemoSeed(today: string = getTodayDateString()): {
  groups: FamilyGroupRow[];
  customers: CustomerRow[];
  transactions: TransactionRow[];
} {
  const groups: FamilyGroupRow[] = [
    {
      id: "grp-nottura-01",
      group_name: "Nottura-01",
      manager_email: "master01.nottura@gmail.com",
      group_type: "shared",
      max_slots: 5,
      master_expired_at: addDaysToDateString(today, 22),
      status: "active",
      notes: "Batch utama pelanggan Solo 35k",
      created_at: addDaysToDateString(today, -45),
    },
    {
      id: "grp-nottura-02",
      group_name: "Nottura-02",
      manager_email: "master02.nottura@gmail.com",
      group_type: "shared",
      max_slots: 5,
      master_expired_at: addDaysToDateString(today, 14),
      status: "active",
      notes: "Slot penuh 5/5",
      created_at: addDaysToDateString(today, -30),
    },
    {
      id: "grp-nottura-03",
      group_name: "Nottura-03",
      manager_email: "master03.nottura@gmail.com",
      group_type: "full",
      max_slots: 5,
      master_expired_at: addDaysToDateString(today, 27),
      status: "full",
      notes: "Private Full Group 150k (Koordinator: Dimas)",
      created_at: addDaysToDateString(today, -15),
    },
    {
      id: "grp-nottura-04",
      group_name: "Nottura-04",
      manager_email: "master04.nottura@gmail.com",
      group_type: "shared",
      max_slots: 5,
      master_expired_at: addDaysToDateString(today, 29),
      status: "active",
      notes: "Grup baru siap isi",
      created_at: addDaysToDateString(today, -5),
    },
  ];

  const customers: CustomerRow[] = [
    {
      id: "cust-1",
      full_name: "Rizky Pratama",
      whatsapp: "6281234567801",
      gmail: "rizky.pratama@gmail.com",
      family_group_id: "grp-nottura-01",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -28),
      end_date: addDaysToDateString(today, 2),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -28),
    },
    {
      id: "cust-2",
      full_name: "Nadya Shafira",
      whatsapp: "6281398765402",
      gmail: "nadya.shafira@gmail.com",
      family_group_id: "grp-nottura-01",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -29),
      end_date: addDaysToDateString(today, 1),
      created_by: "raken@nottura.my.id",
      created_at: addDaysToDateString(today, -29),
    },
    {
      id: "cust-3",
      full_name: "Fajar Nugroho",
      whatsapp: "6285712345603",
      gmail: "fajar.nugroho@gmail.com",
      family_group_id: "grp-nottura-01",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -12),
      end_date: addDaysToDateString(today, 18),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -12),
    },
    {
      id: "cust-4",
      full_name: "Aulia Rahman",
      whatsapp: "6281299887704",
      gmail: "aulia.rahman@gmail.com",
      family_group_id: "grp-nottura-02",
      package_name: "Squad 30k",
      start_date: addDaysToDateString(today, -27),
      end_date: addDaysToDateString(today, 3),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -27),
    },
    {
      id: "cust-5",
      full_name: "Bima Sakti",
      whatsapp: "6281344556605",
      gmail: "bima.sakti@gmail.com",
      family_group_id: "grp-nottura-02",
      package_name: "Squad 30k",
      start_date: addDaysToDateString(today, -20),
      end_date: addDaysToDateString(today, 10),
      created_by: "raken@nottura.my.id",
      created_at: addDaysToDateString(today, -20),
    },
    {
      id: "cust-6",
      full_name: "Citra Kirana",
      whatsapp: "6281577889906",
      gmail: "citra.kirana@gmail.com",
      family_group_id: "grp-nottura-02",
      package_name: "Squad 30k",
      start_date: addDaysToDateString(today, -19),
      end_date: addDaysToDateString(today, 11),
      created_by: "raken@nottura.my.id",
      created_at: addDaysToDateString(today, -19),
    },
    {
      id: "cust-7",
      full_name: "Daffa Wardhana",
      whatsapp: "6281822334407",
      gmail: "daffa.wardhana@gmail.com",
      family_group_id: "grp-nottura-02",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -15),
      end_date: addDaysToDateString(today, 15),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -15),
    },
    {
      id: "cust-8",
      full_name: "Eka Putri",
      whatsapp: "6281911223308",
      gmail: "eka.putri@gmail.com",
      family_group_id: "grp-nottura-02",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -14),
      end_date: addDaysToDateString(today, 16),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -14),
    },
    {
      id: "cust-9",
      full_name: "Dimas Anggara (Koordinator)",
      whatsapp: "6281122334409",
      gmail: "dimas.anggara@gmail.com",
      family_group_id: "grp-nottura-03",
      package_name: "Full Group 150k",
      start_date: addDaysToDateString(today, -10),
      end_date: addDaysToDateString(today, 20),
      created_by: "raken@nottura.my.id",
      created_at: addDaysToDateString(today, -10),
    },
    {
      id: "cust-10",
      full_name: "Gilang Dirga",
      whatsapp: "6281277665510",
      gmail: "gilang.dirga@gmail.com",
      family_group_id: "grp-nottura-04",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -4),
      end_date: addDaysToDateString(today, 26),
      created_by: "arya@nottura.my.id",
      created_at: addDaysToDateString(today, -4),
    },
    {
      id: "cust-11",
      full_name: "Hana Saraswati",
      whatsapp: "6281355443311",
      gmail: "hana.saraswati@gmail.com",
      family_group_id: "grp-nottura-01",
      package_name: "Solo 35k",
      start_date: addDaysToDateString(today, -34),
      end_date: addDaysToDateString(today, -4),
      created_by: "raken@nottura.my.id",
      created_at: addDaysToDateString(today, -34),
    },
  ];

  const yearPrefix = today.slice(0, 4);
  const currentMonth = Number(today.slice(5, 7));
  const prevMonth1 = String(Math.max(1, currentMonth - 1)).padStart(2, "0");
  const prevMonth2 = String(Math.max(1, currentMonth - 2)).padStart(2, "0");

  const transactions: TransactionRow[] = [
    {
      id: "tx-1",
      type: "income",
      category: "new_order",
      amount: 150000,
      customer_id: "cust-9",
      payment_method: "Transfer",
      description: "Order Full Group 150k - Dimas Anggara",
      transaction_date: today,
      recorded_by: "raken@nottura.my.id",
      created_at: today,
    },
    {
      id: "tx-2",
      type: "income",
      category: "new_order",
      amount: 175000,
      customer_id: "cust-1",
      payment_method: "QRIS",
      description: "5x Paket Solo 35k (Batch Nottura-01 & 02)",
      transaction_date: today,
      recorded_by: "arya@nottura.my.id",
      created_at: today,
    },
    {
      id: "tx-3",
      type: "income",
      category: "renewal",
      amount: 90000,
      customer_id: "cust-4",
      payment_method: "QRIS",
      description: "Perpanjangan 3x Squad 30k (Nottura-02)",
      transaction_date: today,
      recorded_by: "arya@nottura.my.id",
      created_at: today,
    },
    {
      id: "tx-4",
      type: "expense",
      category: "account_cost",
      amount: 140000,
      customer_id: null,
      payment_method: "Transfer",
      description: "Modal Akun Induk Google AI Pro (4 Grup)",
      transaction_date: today,
      recorded_by: "raken@nottura.my.id",
      created_at: today,
    },
    {
      id: "tx-5",
      type: "expense",
      category: "operational",
      amount: 25000,
      customer_id: null,
      payment_method: "QRIS",
      description: "Biaya operasional & domain nottura.my.id",
      transaction_date: today,
      recorded_by: "raken@nottura.my.id",
      created_at: today,
    },
    {
      id: "tx-prev-1",
      type: "income",
      category: "new_order",
      amount: 315000,
      customer_id: null,
      payment_method: "QRIS",
      description: "Rekap order pelanggan bulan lalu",
      transaction_date: `${yearPrefix}-${prevMonth1}-15`,
      recorded_by: "arya@nottura.my.id",
      created_at: `${yearPrefix}-${prevMonth1}-15`,
    },
    {
      id: "tx-prev-2",
      type: "expense",
      category: "account_cost",
      amount: 110000,
      customer_id: null,
      payment_method: "Transfer",
      description: "Modal akun induk bulan lalu",
      transaction_date: `${yearPrefix}-${prevMonth1}-10`,
      recorded_by: "raken@nottura.my.id",
      created_at: `${yearPrefix}-${prevMonth1}-10`,
    },
    {
      id: "tx-prev-3",
      type: "income",
      category: "new_order",
      amount: 245000,
      customer_id: null,
      payment_method: "QRIS",
      description: "Rekap order pelanggan 2 bulan lalu",
      transaction_date: `${yearPrefix}-${prevMonth2}-18`,
      recorded_by: "arya@nottura.my.id",
      created_at: `${yearPrefix}-${prevMonth2}-18`,
    },
    {
      id: "tx-prev-4",
      type: "expense",
      category: "account_cost",
      amount: 95000,
      customer_id: null,
      payment_method: "Transfer",
      description: "Modal akun induk 2 bulan lalu",
      transaction_date: `${yearPrefix}-${prevMonth2}-05`,
      recorded_by: "raken@nottura.my.id",
      created_at: `${yearPrefix}-${prevMonth2}-05`,
    },
  ];

  return { groups, customers, transactions };
}

export function buildDemoGroupsWithSlots(
  groups: FamilyGroupRow[],
  customers: CustomerRow[],
  today: string = getTodayDateString(),
): FamilyGroupWithSlots[] {
  return groups.map((g) => calculateGroupSlotInfo(g, customers, today));
}

export function buildDemoEnrichedCustomers(
  groups: FamilyGroupRow[],
  customers: CustomerRow[],
  today: string = getTodayDateString(),
): EnrichedCustomer[] {
  const map: Record<string, string> = {};
  for (const g of groups) {
    map[g.id] = g.group_name;
  }
  return customers.map((c) => enrichCustomer(c, map, today));
}

export function buildDemoDashboardData(
  year: number,
  month: number,
  today: string = getTodayDateString(),
): DashboardData {
  const { groups, customers, transactions } = buildDemoSeed(today);
  const enriched = buildDemoEnrichedCustomers(groups, customers, today);
  const activeCustomers = enriched.filter((c) => c.status !== "expired").length;
  const expiringSoonCount = enriched.filter(
    (c) => c.status === "expiring_soon",
  ).length;
  const totalReadySlots = calculateTotalReadySlots(groups, customers, today);
  const financeSummary = calculateMonthlyFinanceSummary(
    transactions,
    year,
    month,
  );
  const groupNameMap: Record<string, string> = {};
  for (const g of groups) {
    groupNameMap[g.id] = g.group_name;
  }

  return {
    year,
    month,
    kpi: {
      activeCustomers,
      totalReadySlots,
      expiringSoonCount,
      monthlyIncome: financeSummary.income,
      monthlyExpense: financeSummary.expense,
      monthlyNetProfit: financeSummary.netProfit,
    },
    customerGrowthSeries: buildMonthlyCustomerGrowthSeries(customers, year),
    financeSeries: buildMonthlyFinanceSeries(transactions, year),
    upcomingExpirations: getUpcomingExpirations(
      customers,
      5,
      today,
      groupNameMap,
    ),
  };
}
