"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "Akses ditolak. Email Google kamu tidak terdaftar di admin_whitelist.",
  oauth_failed: "Login Google gagal atau dibatalkan. Silakan coba lagi.",
  supabase_not_configured:
    "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authMode,
    supabaseConfigured,
    submitting,
    error,
    loginDummy,
    loginGoogle,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const queryErrorCode = searchParams.get("error");
  const bannerError =
    localError ??
    error ??
    (queryErrorCode ? (ERROR_MESSAGES[queryErrorCode] ?? queryErrorCode) : null);

  async function handleDummySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    try {
      await loginDummy(username, password);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login gagal.");
    }
  }

  async function handleGoogleLogin() {
    setLocalError(null);
    try {
      await loginGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login Google gagal.");
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#090A33] blur-3xl opacity-80"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#090A33] border border-white/15 shadow-lg flex items-center justify-center text-2xl font-bold tracking-tight text-white mb-4">
            N
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Nottura Admin Panel
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Manajemen Slot Google AI Pro, Masa Aktif Pelanggan & Cashflow
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#090A33] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
            <div>
              <h2 className="text-base font-semibold text-white">
                Masuk ke Panel Internal
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Khusus 4 anggota tim operasional Nottura
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/85 border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {authMode === "dummy" ? "Fase 1: Lokal" : "Fase 2: OAuth"}
            </span>
          </div>

          {bannerError ? (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-xs text-rose-200 flex items-start gap-2.5"
            >
              <svg
                className="h-4 w-4 text-rose-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <span>{bannerError}</span>
            </div>
          ) : null}

          {authMode === "dummy" ? (
            <form onSubmit={handleDummySubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-white/75 mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="nottura"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/40 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-white/75 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="•••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#121212] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/40 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-white text-[#090A33] hover:bg-white/90 disabled:opacity-50 font-semibold text-sm py-2.5 px-4 transition cursor-pointer shadow-sm"
                >
                  {submitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 flex items-center justify-between text-xs text-white/65">
                <span>Kredensial Dev (Fase 1):</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("nottura");
                    setPassword("123");
                  }}
                  className="font-mono text-white/90 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Isi otomatis (nottura / 123)
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting || !supabaseConfigured}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-[#090A33] hover:bg-white/90 disabled:opacity-50 font-semibold text-sm py-3 px-4 transition cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.25 5 12c0-3.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span>
                  {submitting ? "Mengalihkan ke Google..." : "Login with Google"}
                </span>
              </button>

              <p className="text-[11px] text-center text-white/55 leading-relaxed">
                Hanya email yang terdaftar pada tabel{" "}
                <code className="text-white/80">admin_whitelist</code> yang
                diizinkan mengakses halaman operasional ini.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          admin.nottura.my.id &bull; Protected Internal Workspace
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#121212] text-white flex items-center justify-center text-sm text-white/60">
          Memuat halaman login...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
