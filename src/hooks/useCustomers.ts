"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CustomerInsert,
  CustomerStatus,
  CustomerUpdate,
  EnrichedCustomer,
  FamilyGroupWithSlots,
} from "@/types/database";
import { fetchCurrentAdmin } from "@/lib/auth/client";
import { checkDuplicateGmail, filterCustomers } from "@/lib/logic/customer";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import { listFamilyGroupsWithSlots } from "@/services/accounts.service";
import {
  createCustomer as createCustomerService,
  deleteCustomer as deleteCustomerService,
  listCustomers,
  renewCustomer as renewCustomerService,
  updateCustomer as updateCustomerService,
  type RecordIncomeOptions,
} from "@/services/customers.service";

export function useCustomers(initialStatus: CustomerStatus | "all" = "all") {
  const [allCustomers, setAllCustomers] = useState<EnrichedCustomer[]>([]);
  const [groups, setGroups] = useState<FamilyGroupWithSlots[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">(
    initialStatus,
  );
  const [groupFilter, setGroupFilter] = useState<string | "all">("all");
  const [adminEmail, setAdminEmail] = useState<string>("nottura@local");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersData, groupsData, authRes] = await Promise.all([
        listCustomers(),
        listFamilyGroupsWithSlots(),
        fetchCurrentAdmin().catch(() => null),
      ]);
      setAllCustomers(customersData);
      setGroups(groupsData);
      if (authRes?.user?.email) {
        setAdminEmail(authRes.user.email);
      }
      setSupabaseConfigured(true);
    } catch (err) {
      if (err instanceof SupabaseNotConfiguredError) {
        setSupabaseConfigured(false);
      }
      setError(
        err instanceof Error ? err.message : "Gagal memuat data pelanggan.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const customers = useMemo(
    () =>
      filterCustomers(allCustomers, {
        search,
        status: statusFilter,
        familyGroupId: groupFilter,
      }),
    [allCustomers, search, statusFilter, groupFilter],
  );

  const checkGmailDuplicate = useCallback(
    (gmail: string, excludeCustomerId?: string) =>
      checkDuplicateGmail(gmail, allCustomers, excludeCustomerId),
    [allCustomers],
  );

  const createCustomer = useCallback(
    async (
      payload: CustomerInsert,
      options?: { recordIncome?: RecordIncomeOptions },
    ) => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await createCustomerService(
          payload,
          adminEmail,
          options,
        );
        await refresh();
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menambah pelanggan.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [adminEmail, refresh],
  );

  const updateCustomer = useCallback(
    async (id: string, payload: CustomerUpdate) => {
      setSubmitting(true);
      setError(null);
      try {
        const updated = await updateCustomerService(id, payload);
        await refresh();
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memperbarui pelanggan.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await deleteCustomerService(id);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menghapus pelanggan.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const renewCustomer = useCallback(
    async (
      id: string,
      options?: { days?: number; recordIncome?: RecordIncomeOptions },
    ) => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await renewCustomerService(id, adminEmail, options);
        await refresh();
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memperpanjang pelanggan.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [adminEmail, refresh],
  );

  return {
    customers,
    allCustomers,
    groups,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    groupFilter,
    setGroupFilter,
    loading,
    submitting,
    error,
    supabaseConfigured,
    refresh,
    checkGmailDuplicate,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    renewCustomer,
  };
}
