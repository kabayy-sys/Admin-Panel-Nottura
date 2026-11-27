import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DUMMY_COOKIE_NAME,
  DUMMY_COOKIE_VALUE,
  isDummyAuthAllowed,
} from "@/lib/auth/config";
import { checkAdminWhitelist } from "@/lib/auth/whitelist";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

function redirectWithCookies(
  targetUrl: URL,
  sourceResponse: NextResponse,
): NextResponse {
  const redirectResponse = NextResponse.redirect(targetUrl);
  for (const cookie of sourceResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/login";

  if (isDummyAuthAllowed()) {
    const isDummyAuthenticated =
      request.cookies.get(DUMMY_COOKIE_NAME)?.value === DUMMY_COOKIE_VALUE;

    if (isLoginRoute && isDummyAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!isLoginRoute && !isDummyAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    if (isLoginRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", request.url),
    );
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    if (isLoginRoute) {
      return response;
    }
    return redirectWithCookies(new URL("/login", request.url), response);
  }

  const whitelisted = await checkAdminWhitelist(supabase, user.email);
  if (!whitelisted) {
    await supabase.auth.signOut();
    if (isLoginRoute) {
      const errorParam = request.nextUrl.searchParams.get("error");
      if (errorParam === "access_denied") {
        return response;
      }
      return redirectWithCookies(
        new URL("/login?error=access_denied", request.url),
        response,
      );
    }
    return redirectWithCookies(
      new URL("/login?error=access_denied", request.url),
      response,
    );
  }

  if (isLoginRoute) {
    return redirectWithCookies(new URL("/", request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
