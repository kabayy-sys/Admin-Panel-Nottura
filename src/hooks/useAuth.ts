"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSessionUser } from "@/types/database";
import {
  fetchCurrentAdmin,
  loginWithDummyCredentials,
  loginWithGoogle,
  logoutAdmin,
} from "@/lib/auth/client";

export function useAuth() {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [authMode, setAuthMode] = useState<"dummy" | "supabase">("supabase");
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCurrentAdmin();
      setUser(result.user);
      setAuthMode(result.authMode);
      setSupabaseConfigured(result.supabaseConfigured);
      setError(result.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memeriksa sesi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loginDummy = useCallback(
    async (username: string, password: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await loginWithDummyCredentials(username, password);
        setUser(result.user);
        return result.user;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal login dummy.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const loginGoogle = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memulai login Google.";
      setError(message);
      setSubmitting(false);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await logoutAdmin();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal logout.";
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    user,
    authMode,
    supabaseConfigured,
    loading,
    submitting,
    error,
    refresh,
    loginDummy,
    loginGoogle,
    logout,
  };
}
