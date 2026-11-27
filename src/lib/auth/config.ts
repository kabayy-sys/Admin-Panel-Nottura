import type { AuthSessionUser } from "@/types/database";

export const DUMMY_COOKIE_NAME = "nottura_dev_session";
export const DUMMY_COOKIE_VALUE = "authenticated";

export const DUMMY_CREDENTIALS = {
  username: "nottura",
  password: "123",
} as const;

export const DUMMY_ADMIN_USER: AuthSessionUser = {
  email: "nottura@local",
  name: "Nottura Dev Admin",
  role: "owner",
  mode: "dummy",
};

/**
 * Login dummy (`nottura` / `123`) HANYA diizinkan saat lokal non-produksi
 * dan `NEXT_PUBLIC_AUTH_MODE=dummy`.
 */
export function isDummyAuthAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  authMode: string | undefined = process.env.NEXT_PUBLIC_AUTH_MODE,
): boolean {
  return nodeEnv !== "production" && authMode === "dummy";
}

export function getAuthMode(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  authMode: string | undefined = process.env.NEXT_PUBLIC_AUTH_MODE,
): "dummy" | "supabase" {
  return isDummyAuthAllowed(nodeEnv, authMode) ? "dummy" : "supabase";
}

export function validateDummyCredentials(
  username: string,
  password: string,
): boolean {
  return (
    username === DUMMY_CREDENTIALS.username &&
    password === DUMMY_CREDENTIALS.password
  );
}
