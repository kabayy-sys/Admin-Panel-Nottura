import { describe, expect, it } from "vitest";
import {
  getAuthMode,
  isDummyAuthAllowed,
  validateDummyCredentials,
} from "@/lib/auth/config";

describe("auth config", () => {
  it("allows dummy auth only in non-production when NEXT_PUBLIC_AUTH_MODE=dummy", () => {
    expect(isDummyAuthAllowed("development", "dummy")).toBe(true);
    expect(isDummyAuthAllowed("test", "dummy")).toBe(true);
    expect(getAuthMode("development", "dummy")).toBe("dummy");
  });

  it("forcibly disables dummy auth in production even if NEXT_PUBLIC_AUTH_MODE=dummy", () => {
    expect(isDummyAuthAllowed("production", "dummy")).toBe(false);
    expect(getAuthMode("production", "dummy")).toBe("supabase");
  });

  it("defaults to supabase mode when NEXT_PUBLIC_AUTH_MODE is supabase or unset", () => {
    expect(isDummyAuthAllowed("development", "supabase")).toBe(false);
    expect(isDummyAuthAllowed("development", undefined)).toBe(false);
    expect(getAuthMode("development", undefined)).toBe("supabase");
  });

  it("validates exact dummy credentials nottura / 123", () => {
    expect(validateDummyCredentials("nottura", "123")).toBe(true);
    expect(validateDummyCredentials("nottura", "wrong")).toBe(false);
    expect(validateDummyCredentials("admin", "123")).toBe(false);
  });
});
