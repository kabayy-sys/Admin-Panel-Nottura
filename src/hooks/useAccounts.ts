"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  EnrichedCustomer,
  FamilyGroupInsert,
  FamilyGroupUpdate,
  FamilyGroupWithSlots,
} from "@/types/database";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import {
  createFamilyGroup,
  deleteFamilyGroup,
  getGroupMembers,
  listFamilyGroupsWithSlots,
  updateFamilyGroup,
} from "@/services/accounts.service";

export function useAccounts() {
  const [groups, setGroups] = useState<FamilyGroupWithSlots[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<
    EnrichedCustomer[]
  >([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listFamilyGroupsWithSlots();
      setGroups(rows);
      setSupabaseConfigured(true);
    } catch (err) {
      if (err instanceof SupabaseNotConfiguredError) {
        setSupabaseConfigured(false);
      }
      setError(
        err instanceof Error ? err.message : "Gagal memuat akun Google Pro.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadGroupMembers = useCallback(async (groupId: string) => {
    setLoadingMembers(true);
    setError(null);
    try {
      const members = await getGroupMembers(groupId);
      setSelectedGroupMembers(members);
      return members;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat anggota grup.";
      setError(message);
      throw err;
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const createGroup = useCallback(
    async (payload: FamilyGroupInsert) => {
      setSubmitting(true);
      setError(null);
      try {
        const created = await createFamilyGroup(payload);
        await refresh();
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menambahkan akun.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const updateGroup = useCallback(
    async (id: string, payload: FamilyGroupUpdate) => {
      setSubmitting(true);
      setError(null);
      try {
        const updated = await updateFamilyGroup(id, payload);
        await refresh();
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memperbarui akun.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await deleteFamilyGroup(id);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menghapus akun.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  return {
    groups,
    selectedGroupMembers,
    loadingMembers,
    loading,
    submitting,
    error,
    supabaseConfigured,
    refresh,
    loadGroupMembers,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
