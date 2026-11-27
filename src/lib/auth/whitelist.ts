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
    .limit(10);

  if (error || !data) {
    return null;
  }

  const rows = data as AdminWhitelistRow[];
  return (
    rows.find((row) => row.email.trim().toLowerCase() === normalizedEmail) ??
    null
  );
}
