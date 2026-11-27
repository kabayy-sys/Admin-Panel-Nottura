import type { AuthSessionUser } from "@/types/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AuthMeResponse {
  user: AuthSessionUser | null;
  authMode: "dummy" | "supabase";
  supabaseConfigured: boolean;
  error?: string;
}

/**
 * Login Fase 1 (Development/Lokal): username `nottura`, password `123`.
 */
export async function loginWithDummyCredentials(
  username: string,
  password: string,
): Promise<{ user: AuthSessionUser }> {
  const response = await fetch("/api/auth/dummy-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    user?: AuthSessionUser;
    error?: string;
  };

  if (!response.ok || !payload.user) {
    throw new Error(payload.error ?? "Gagal login dengan akun dummy.");
  }

  return { user: payload.user };
}

/**
 * Login Fase 2 (Production): Google OAuth via Supabase Auth.
 */
export async function loginWithGoogle(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Logout dari sesi dummy maupun Supabase Auth.
 */
export async function logoutAdmin(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Gagal logout.");
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  }
}

/**
 * Mengambil status sesi admin saat ini dari server.
 */
export async function fetchCurrentAdmin(): Promise<AuthMeResponse> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memeriksa sesi admin.");
  }

  return (await response.json()) as AuthMeResponse;
}
