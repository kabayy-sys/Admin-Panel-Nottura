import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminWhitelistRow } from "@/types/database";

/**
 * Mengecek apakah email user terdaftar pada tabel `admin_whitelist` (case-insensitive).
 * Karena RLS membatasi SELECT hanya ke row yang email-nya cocok dengan JWT,
 * user non-whitelist akan menerima hasil kosong (`null`).
 */
export async function checkAdminWhitelist(
  supabase: SupabaseClient,
  email: string,
): Promise<AdminWhitelistRow | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("id, email, name, role, created_at")
    .limit(50);

  if (error || !data) {
    if (error) {
      console.error("[Auth] checkAdminWhitelist error:", error.message, error.details);
    }
    return null;
  }

  const rows = data as AdminWhitelistRow[];
  const match = rows.find(
    (row) => row.email.trim().toLowerCase() === normalizedEmail,
  );

  if (!match) {
    console.warn(
      `[Auth] Whitelist check failed for "${normalizedEmail}". Available in DB:`,
      rows.map((r) => r.email),
    );
  }

  return match ?? null;
}
