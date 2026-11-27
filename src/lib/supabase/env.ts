export class SupabaseNotConfiguredError extends Error {
  constructor(
    message = "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.",
  ) {
    super(message);
    this.name = "SupabaseNotConfiguredError";
  }
}

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Mengecek apakah env Supabase sudah terisi tanpa melempar error saat build/import.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

/**
 * Mengambil konfigurasi Supabase. Melempar `SupabaseNotConfiguredError` jika belum diisi.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new SupabaseNotConfiguredError();
  }

  return { url, anonKey };
}
