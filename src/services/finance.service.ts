import type {
  TransactionInsert,
  TransactionRow,
  TransactionType,
  TransactionUpdate,
} from "@/types/database";
import { getTodayDateString } from "@/lib/logic/customer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TransactionFilter {
  year?: number;
  month?: number;
  type?: TransactionType | "all";
}

function getMonthDateRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const paddedMonth = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0))
    .toISOString()
    .slice(0, 10);
  return {
    start: `${year}-${paddedMonth}-01`,
    end: lastDay,
  };
}

/**
 * Mengambil daftar transaksi keuangan dengan filter opsional tahun, bulan, dan tipe (`income`/`expense`).
 */
export async function listTransactions(
  filter?: TransactionFilter,
): Promise<TransactionRow[]> {
  const supabase = createSupabaseBrowserClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter?.type && filter.type !== "all") {
    query = query.eq("type", filter.type);
  }

  if (filter?.year && filter?.month) {
    const { start, end } = getMonthDateRange(filter.year, filter.month);
    query = query.gte("transaction_date", start).lte("transaction_date", end);
  } else if (filter?.year) {
    query = query
      .gte("transaction_date", `${filter.year}-01-01`)
      .lte("transaction_date", `${filter.year}-12-31`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TransactionRow[];
}

/**
 * Mencatat transaksi pemasukan atau pengeluaran baru dengan audit trail `recorded_by`.
 */
export async function createTransaction(
  payload: TransactionInsert,
  adminEmail: string,
): Promise<TransactionRow> {
  const supabase = createSupabaseBrowserClient();
  const insertData = {
    type: payload.type,
    category: payload.category,
    amount: Math.max(0, Math.round(payload.amount)),
    customer_id: payload.customer_id ?? null,
    payment_method: payload.payment_method ?? null,
    description: payload.description ?? null,
    transaction_date:
      payload.transaction_date?.trim() || getTodayDateString(),
    recorded_by: payload.recorded_by?.trim() || adminEmail,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TransactionRow;
}

/**
 * Memperbarui catatan transaksi berdasarkan ID.
 */
export async function updateTransaction(
  id: string,
  payload: TransactionUpdate,
): Promise<TransactionRow> {
  const supabase = createSupabaseBrowserClient();
  const updateData: TransactionUpdate = {
    ...payload,
    ...(payload.amount !== undefined
      ? { amount: Math.max(0, Math.round(payload.amount)) }
      : {}),
  };

  const { data, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TransactionRow;
}

/**
 * Menghapus catatan transaksi berdasarkan ID.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
