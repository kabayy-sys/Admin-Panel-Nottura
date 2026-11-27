import { describe, expect, it } from "vitest";
import type { CustomerRow, TransactionRow } from "@/types/database";
import {
  buildMonthlyCustomerGrowthSeries,
  buildMonthlyFinanceSeries,
  calculateMonthlyFinanceSummary,
  exportTransactionsToCsv,
} from "@/lib/logic/finance";

const makeTx = (overrides: Partial<TransactionRow>): TransactionRow => ({
  id: "tx-1",
  type: "income",
  category: "new_order",
  amount: 35000,
  customer_id: null,
  payment_method: "QRIS",
  description: "Order baru",
  transaction_date: "2026-11-10",
  recorded_by: "raken@nottura.my.id",
  created_at: "2026-11-10T00:00:00Z",
  ...overrides,
});

const makeCustomer = (overrides: Partial<CustomerRow>): CustomerRow => ({
  id: "cust-1",
  full_name: "Andi",
  whatsapp: "6281234567890",
  gmail: "andi@gmail.com",
  family_group_id: null,
  package_name: "Solo 35k",
  start_date: "2026-11-01",
  end_date: "2026-12-01",
  created_by: "raken@nottura.my.id",
  created_at: "2026-11-01T00:00:00Z",
  ...overrides,
});

describe("finance logic", () => {
  it("calculates monthly income, expense, and net profit", () => {
    const transactions = [
      makeTx({ id: "1", type: "income", amount: 35000, transaction_date: "2026-11-02" }),
      makeTx({ id: "2", type: "income", amount: 150000, transaction_date: "2026-11-05" }),
      makeTx({ id: "3", type: "expense", category: "account_cost", amount: 80000, transaction_date: "2026-11-06" }),
      makeTx({ id: "4", type: "income", amount: 30000, transaction_date: "2026-10-20" }),
    ];

    const summary = calculateMonthlyFinanceSummary(transactions, 2026, 11);
    expect(summary).toEqual({
      income: 185000,
      expense: 80000,
      netProfit: 105000,
      count: 3,
    });
  });

  it("builds a 12-month finance series and customer growth series", () => {
    const transactions = [
      makeTx({ id: "1", type: "income", amount: 50000, transaction_date: "2026-01-15" }),
      makeTx({ id: "2", type: "expense", amount: 20000, transaction_date: "2026-01-20" }),
      makeTx({ id: "3", type: "income", amount: 35000, transaction_date: "2026-11-05" }),
    ];

    const financeSeries = buildMonthlyFinanceSeries(transactions, 2026);
    expect(financeSeries).toHaveLength(12);
    expect(financeSeries[0]).toEqual({
      month: 1,
      label: "Jan",
      income: 50000,
      expense: 20000,
      netProfit: 30000,
    });
    expect(financeSeries[10].label).toBe("Nov");
    expect(financeSeries[10].income).toBe(35000);

    const customers = [
      makeCustomer({ id: "c0", start_date: "2025-12-15" }),
      makeCustomer({ id: "c1", start_date: "2026-01-05" }),
      makeCustomer({ id: "c2", start_date: "2026-01-18" }),
      makeCustomer({ id: "c3", start_date: "2026-03-02" }),
    ];

    const growthSeries = buildMonthlyCustomerGrowthSeries(customers, 2026);
    expect(growthSeries).toHaveLength(12);
    expect(growthSeries[0]).toEqual({
      month: 1,
      label: "Jan",
      newCustomers: 2,
      cumulativeCustomers: 3,
    });
    expect(growthSeries[1].cumulativeCustomers).toBe(3);
    expect(growthSeries[2].newCustomers).toBe(1);
    expect(growthSeries[2].cumulativeCustomers).toBe(4);
  });

  it("exports transactions to escaped RFC 4180 CSV", () => {
    const csv = exportTransactionsToCsv([
      makeTx({
        description: 'Order "Solo", QRIS',
        amount: 35000,
        payment_method: "QRIS",
      }),
    ]);

    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "Tanggal,Tipe,Kategori,Nominal,Metode Pembayaran,Keterangan,Dicatat Oleh",
    );
    expect(lines[1]).toBe(
      '2026-11-10,Masuk,new_order,35000,QRIS,"Order ""Solo"", QRIS",raken@nottura.my.id',
    );
  });
});
