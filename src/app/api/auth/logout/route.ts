import { NextResponse } from "next/server";
import { DUMMY_COOKIE_NAME } from "@/lib/auth/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DUMMY_COOKIE_NAME);
  return response;
}
