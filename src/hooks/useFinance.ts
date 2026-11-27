"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MonthlyFinanceSummary,
  TransactionInsert,
  TransactionRow,
  TransactionType,
} from "@/types/database";
import { fetchCurrentAdmin } from "@/lib/auth/client";
import { getTodayDateString } from "@/lib/logic/customer";
import {
  calculateMonthlyFinanceSummary,
  exportTransactionsToCsv,
} from "@/lib/logic/finance";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import {
  createTransaction as createTransactionService,
  deleteTransaction as deleteTransactionService,
  listTransactions,
} from "@/services/finance.service";

export function useFinance(initialYear?: number, initialMonth?: number) {
  const today = getTodayDateString();
  const [year, setYear] = useState<number>(
    initialYear ?? Number(today.slice(0, 4)),
  );
  const [month, setMonth] = useState<number>(
    initialMonth ?? Number(today.slice(5, 7)),
  );
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [adminEmail, setAdminEmail] = useState<string>("nottura@local");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, authRes] = await Promise.all([
        listTransactions({ year, month, type: typeFilter }),
        fetchCurrentAdmin().catch(() => null),
      ]);
      setTransactions(rows);
      if (authRes?.user?.email) {
        setAdminEmail(authRes.user.email);
      }
      setSupabaseConfigured(true);
    } catch (err) {
      if (err instanceof SupabaseNotConfiguredError) {
        setSupabaseConfigured(false);
      }
      setError(
        err instanceof Error ? err.message : "Gagal memuat transaksi keuangan.",
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, typeFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary: MonthlyFinanceSummary = useMemo(
    () => calculateMonthlyFinanceSummary(transactions, year, month),
    [transactions, year, month],
  );

  const createTransaction = useCallback(
    async (payload: TransactionInsert) => {
      setSubmitting(true);
      setError(null);
      try {
        const created = await createTransactionService(payload, adminEmail);
        await refresh();
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal mencatat transaksi.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [adminEmail, refresh],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await deleteTransactionService(id);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menghapus transaksi.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const getCsvContent = useCallback(
    () => exportTransactionsToCsv(transactions),
    [transactions],
  );

  const downloadCsv = useCallback(() => {
    const csv = exportTransactionsToCsv(transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nottura-finance-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [transactions, year, month]);

  return {
    transactions,
    summary,
    year,
    setYear,
    month,
    setMonth,
    typeFilter,
    setTypeFilter,
    loading,
    submitting,
    error,
    supabaseConfigured,
    refresh,
    createTransaction,
    deleteTransaction,
    getCsvContent,
    downloadCsv,
  };
}
