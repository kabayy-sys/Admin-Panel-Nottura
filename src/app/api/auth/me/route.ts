import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  DUMMY_ADMIN_USER,
  DUMMY_COOKIE_NAME,
  DUMMY_COOKIE_VALUE,
  getAuthMode,
  isDummyAuthAllowed,
} from "@/lib/auth/config";
import { checkAdminWhitelist } from "@/lib/auth/whitelist";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const authMode = getAuthMode();
  const supabaseConfigured = isSupabaseConfigured();

  if (isDummyAuthAllowed()) {
    const cookieStore = await cookies();
    const hasDummySession =
      cookieStore.get(DUMMY_COOKIE_NAME)?.value === DUMMY_COOKIE_VALUE;

    return NextResponse.json({
      user: hasDummySession ? DUMMY_ADMIN_USER : null,
      authMode,
      supabaseConfigured,
    });
  }

  if (!supabaseConfigured) {
    return NextResponse.json({
      user: null,
      authMode,
      supabaseConfigured: false,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({
      user: null,
      authMode,
      supabaseConfigured: true,
    });
  }

  const whitelisted = await checkAdminWhitelist(supabase, user.email);
  if (!whitelisted) {
    await supabase.auth.signOut();
    return NextResponse.json({
      user: null,
      authMode,
      supabaseConfigured: true,
      error: "access_denied",
    });
  }

  return NextResponse.json({
    user: {
      email: whitelisted.email,
      name: whitelisted.name,
      role: whitelisted.role,
      mode: "supabase",
    },
    authMode,
    supabaseConfigured: true,
  });
}
