import type {
  CustomerRow,
  MonthlyCustomerGrowthPoint,
  MonthlyFinancePoint,
  MonthlyFinanceSummary,
  TransactionRow,
} from "@/types/database";

const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

function parseYearMonth(dateStr: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})-\d{2}/.exec(dateStr.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

/**
 * Menghitung ringkasan pemasukan, pengeluaran, dan profit bersih pada bulan tertentu (`month` 1..12).
 */
export function calculateMonthlyFinanceSummary(
  transactions: TransactionRow[],
  year: number,
  month: number,
): MonthlyFinanceSummary {
  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    const parsed = parseYearMonth(tx.transaction_date);
    if (!parsed || parsed.year !== year || parsed.month !== month) {
      continue;
    }

    count += 1;
    if (tx.type === "income") {
      income += tx.amount;
    } else if (tx.type === "expense") {
      expense += tx.amount;
    }
  }

  return {
    income,
    expense,
    netProfit: income - expense,
    count,
  };
}

/**
 * Menyusun seri data 12 bulan untuk Grafik Keuangan (Pemasukan vs Pengeluaran vs Profit Bersih).
 */
export function buildMonthlyFinanceSeries(
  transactions: TransactionRow[],
  year: number,
): MonthlyFinancePoint[] {
  return SHORT_MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const summary = calculateMonthlyFinanceSummary(transactions, year, month);
    return {
      month,
      label,
      income: summary.income,
      expense: summary.expense,
      netProfit: summary.netProfit,
    };
  });
}

/**
 * Menyusun seri data 12 bulan untuk Grafik Kenaikan Pelanggan berdasarkan `start_date`.
 */
export function buildMonthlyCustomerGrowthSeries(
  customers: CustomerRow[],
  year: number,
): MonthlyCustomerGrowthPoint[] {
  const newPerMonth = new Array<number>(12).fill(0);
  let priorCount = 0;

  for (const customer of customers) {
    const parsed = parseYearMonth(customer.start_date);
    if (!parsed) {
      continue;
    }

    if (parsed.year < year) {
      priorCount += 1;
    } else if (parsed.year === year) {
      newPerMonth[parsed.month - 1] += 1;
    }
  }

  let runningCumulative = priorCount;
  return SHORT_MONTH_LABELS.map((label, index) => {
    const newCustomers = newPerMonth[index];
    runningCumulative += newCustomers;
    return {
      month: index + 1,
      label,
      newCustomers,
      cumulativeCustomers: runningCumulative,
    };
  });
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Mengekspor daftar transaksi ke string CSV berformat RFC 4180.
 */
export function exportTransactionsToCsv(transactions: TransactionRow[]): string {
  const headers = [
    "Tanggal",
    "Tipe",
    "Kategori",
    "Nominal",
    "Metode Pembayaran",
    "Keterangan",
    "Dicatat Oleh",
  ];

  const rows = transactions.map((tx) =>
    [
      escapeCsvCell(tx.transaction_date),
      escapeCsvCell(tx.type === "income" ? "Masuk" : "Keluar"),
      escapeCsvCell(tx.category),
      escapeCsvCell(tx.amount),
      escapeCsvCell(tx.payment_method ?? ""),
      escapeCsvCell(tx.description ?? ""),
      escapeCsvCell(tx.recorded_by),
    ].join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
