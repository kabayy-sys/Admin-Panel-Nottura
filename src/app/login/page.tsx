"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Akses ditolak. Email Google kamu tidak terdaftar di admin_whitelist.",
  oauth_failed: "Login Google gagal atau dibatalkan. Silakan coba lagi.",
  supabase_not_configured:
    "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authMode, supabaseConfigured, submitting, error, loginDummy, loginGoogle } =
    useAuth();

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

  // TODO(Arya): Ganti markup polos di bawah dengan desain halaman Login dark mode (#121212 / #090A33 / #FFFFFF).
  return (
    <main>
      <h1>Login Nottura Admin</h1>
      <p>Mode Auth Aktif: {authMode}</p>

      {bannerError ? <p role="alert">{bannerError}</p> : null}

      {authMode === "dummy" ? (
        <form onSubmit={handleDummySubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Memproses..." : "Login Dummy"}
          </button>
        </form>
      ) : (
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting || !supabaseConfigured}
          >
            Login with Google
          </button>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main>Memuat halaman login...</main>}>
      <LoginContent />
    </Suspense>
  );
}
