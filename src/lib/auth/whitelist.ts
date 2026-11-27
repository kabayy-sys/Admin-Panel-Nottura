import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminWhitelistRow } from "@/types/database";

/**
 * Mengecek apakah email user terdaftar pada tabel `admin_whitelist` (case-insensitive).
 */
export async function checkAdminWhitelist(
  supabase: SupabaseClient,
  email: string,
): Promise<AdminWhitelistRow | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  // 1. Coba query langsung dari tabel admin_whitelist dengan filter email
  const { data: directData, error: directError } = await supabase
    .from("admin_whitelist")
    .select("id, email, name, role, created_at")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (!directError && directData) {
    return directData as AdminWhitelistRow;
  }

  // 2. Coba via RPC check_whitelist jika direct query terhalang RLS token timing
  try {
    const { data: isAllowed, error: rpcError } = await supabase.rpc(
      "check_whitelist",
      { p_email: normalizedEmail },
    );

    if (!rpcError && isAllowed === true) {
      return {
        id: "whitelisted-rpc",
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        role: "admin",
        created_at: new Date().toISOString(),
      };
    }
  } catch {
    // Abaikan jika RPC belum dibuat di DB
  }

  // 3. Fallback scan row jika tabel bisa dibaca
  const { data: listData, error: listError } = await supabase
    .from("admin_whitelist")
    .select("id, email, name, role, created_at")
    .limit(50);

  if (listData && !listError) {
    const rows = listData as AdminWhitelistRow[];
    const match = rows.find(
      (row) => row.email.trim().toLowerCase() === normalizedEmail,
    );
    if (match) {
      return match;
    }
  }

  if (directError) {
    console.warn("[Auth] Whitelist check warning:", directError.message);
  }

  return null;
}
