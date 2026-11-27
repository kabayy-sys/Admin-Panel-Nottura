import { NextResponse } from "next/server";
import { checkAdminWhitelist } from "@/lib/auth/whitelist";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeRedirectPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return "/";
  }
  return nextParam;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = sanitizeRedirectPath(url.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const whitelisted = await checkAdminWhitelist(supabase, data.user.email);
  if (!whitelisted) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=access_denied", url.origin),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
