"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "Akses ditolak. Email Google kamu tidak terdaftar di admin_whitelist.",
  oauth_failed: "Login Google gagal atau dibatalkan. Silakan coba lagi.",
  supabase_not_configured:
    "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};

const PILLARS = [
  {
    index: "01",
    title: "Slot Google AI Pro Real-Time",
    description:
      "Pantau kapasitas 5 slot per grup Shared maupun Full Group tanpa spreadsheet terpisah.",
  },
  {
    index: "02",
    title: "Kontrol Masa Aktif & Remind WA",
    description:
      "Deteksi otomatis pelanggan H-3 Expired dengan pengingat WhatsApp 1-klik yang konsisten.",
  },
  {
    index: "03",
    title: "Arus Kas & Profit Terintegrasi",
    description:
      "Pemasukan order baru, perpanjangan, modal akun induk, dan profit bersih tercatat rapi tiap bulan.",
  },
] as const;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authMode,
    supabaseConfigured,
    loading,
    submitting,
    error,
    loginDummy,
    loginGoogle,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const queryErrorCode = searchParams.get("error");
  const attemptedEmail = searchParams.get("email");
  const bannerError =
    localError ??
    error ??
    (queryErrorCode === "access_denied" && attemptedEmail
      ? `Akses ditolak. Email Google "${attemptedEmail}" tidak terdaftar di admin_whitelist.`
      : queryErrorCode
        ? (ERROR_MESSAGES[queryErrorCode] ?? queryErrorCode)
        : null);

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
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Editorial Panel */}
      <section className="hidden lg:flex lg:col-span-6 bg-[#101014] border-r border-white/[0.08] p-12 xl:p-16 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FAFAFA] text-[#09090B] flex items-center justify-center font-bold text-base tracking-tight">
              N
            </div>
            <div>
              <span className="font-semibold text-sm text-[#FAFAFA] block leading-none">
                Nottura
              </span>
              <span className="font-mono text-[11px] text-[#71717A] mt-1 block">
                admin.nottura.my.id
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 max-w-md"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#71717A]">
              Internal Operations Console
            </p>
            <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-[#FAFAFA] mt-3 leading-[1.15]">
              Kontrol Operasional Nottura dalam Satu Layar.
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-4 leading-relaxed">
              Dirancang khusus untuk 4 anggota tim internal agar pengelolaan
              slot Google AI Pro, perpanjangan pelanggan, dan cashflow berjalan
              cepat dan presisi.
            </p>
          </motion.div>
        </div>

        <div className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08] max-w-lg">
          {PILLARS.map((item, idx) => (
            <motion.div
              key={item.index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.08 + idx * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="py-4 flex items-start gap-4"
            >
              <span className="font-mono text-xs text-[#71717A] pt-0.5 shrink-0">
                {item.index}
              </span>
              <div>
                <h2 className="text-sm font-medium text-[#FAFAFA]">
                  {item.title}
                </h2>
                <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Right Clean Login Surface */}
      <section className="lg:col-span-6 flex flex-col justify-center items-center px-4 sm:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile Brand Header */}
          <div className="flex flex-col items-center text-center mb-8 lg:hidden">
            <div className="h-11 w-11 rounded-xl bg-[#FAFAFA] text-[#09090B] flex items-center justify-center text-lg font-bold tracking-tight mb-3">
              N
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[#FAFAFA]">
              Nottura Admin Panel
            </h1>
            <p className="text-xs text-[#71717A] mt-1">
              Operasional Slot Google AI Pro &amp; Cashflow
            </p>
          </div>

          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 pb-5 mb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#17171D] border border-white/[0.09] flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#A1A1AA]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#FAFAFA]">
                    Masuk ke Workspace
                  </h2>
                  <p className="text-[11px] text-[#71717A]">
                    Khusus 4 anggota tim Nottura
                  </p>
                </div>
              </div>

              {loading ? (
                <span className="h-6 w-20 rounded-full bg-[#17171D] animate-pulse" />
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#17171D] text-[#E4E4E7] border border-white/[0.09]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  {authMode === "dummy" ? "Lokal Dev" : "Google OAuth"}
                </span>
              )}
            </div>

            {bannerError ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="mb-5 rounded-xl bg-[#17171D] border border-white/[0.1] border-l-2 border-l-[#EF4444] px-3.5 py-3 text-xs text-[#E4E4E7] flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{bannerError}</span>
              </motion.div>
            ) : null}

            {loading ? (
              <div className="space-y-4 py-2 animate-pulse">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-[#17171D]" />
                  <div className="h-10 rounded-xl bg-[#17171D]" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-[#17171D]" />
                  <div className="h-10 rounded-xl bg-[#17171D]" />
                </div>
                <div className="h-10 rounded-xl bg-[#17171D] mt-2" />
              </div>
            ) : authMode === "dummy" ? (
              <form onSubmit={handleDummySubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-medium text-[#A1A1AA] mb-1.5"
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
                    className="input-field w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-[#52525B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-[#A1A1AA] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="•••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-field w-full rounded-xl pl-3.5 pr-10 py-2.5 text-sm placeholder:text-[#52525B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Lihat password"
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#FAFAFA] transition cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white disabled:opacity-50 font-semibold text-sm py-2.5 px-4 transition cursor-pointer"
                  >
                    <span>
                      {submitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>

                <div className="rounded-xl surface-inset px-3.5 py-2.5 flex items-center justify-between text-xs text-[#71717A]">
                  <span>Kredensial Dev:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername("nottura");
                      setPassword("123");
                    }}
                    className="font-mono text-[#E4E4E7] hover:text-[#FAFAFA] underline underline-offset-4 decoration-white/25 cursor-pointer transition"
                  >
                    Isi otomatis (nottura / 123)
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting || !supabaseConfigured}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white disabled:opacity-50 font-semibold text-sm py-3 px-4 transition cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.25 5 12c0-3.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                    />
                  </svg>
                  <span>
                    {submitting
                      ? "Mengalihkan ke Google..."
                      : "Login with Google"}
                  </span>
                </motion.button>

                <div className="rounded-xl surface-inset px-3.5 py-3 flex items-start gap-2.5 text-[11px] text-[#A1A1AA] leading-relaxed">
                  <ShieldCheck className="h-4 w-4 text-[#FAFAFA] shrink-0 mt-0.5" />
                  <span>
                    Hanya email terdaftar pada tabel{" "}
                    <code className="font-mono text-[#FAFAFA]">
                      admin_whitelist
                    </code>{" "}
                    yang dapat mengakses panel operasional ini.
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-center font-mono text-[11px] text-[#52525B] mt-6">
            admin.nottura.my.id &bull; Protected Internal Workspace
          </p>
        </motion.div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center text-xs text-[#71717A]">
          Memuat halaman login...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
