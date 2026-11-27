"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardData } from "@/types/database";
import { getTodayDateString } from "@/lib/logic/customer";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import { getDashboardData } from "@/services/dashboard.service";

export function useDashboard(initialYear?: number, initialMonth?: number) {
  const today = getTodayDateString();
  const [year, setYear] = useState<number>(
    initialYear ?? Number(today.slice(0, 4)),
  );
  const [month, setMonth] = useState<number>(
    initialMonth ?? Number(today.slice(5, 7)),
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardData({ year, month });
      setData(result);
      setSupabaseConfigured(true);
    } catch (err) {
      if (err instanceof SupabaseNotConfiguredError) {
        setSupabaseConfigured(false);
      }
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    year,
    setYear,
    month,
    setMonth,
    data,
    loading,
    error,
    supabaseConfigured,
    refresh,
  };
}
