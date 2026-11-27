import { NextResponse } from "next/server";
import {
  DUMMY_ADMIN_USER,
  DUMMY_COOKIE_NAME,
  DUMMY_COOKIE_VALUE,
  isDummyAuthAllowed,
  validateDummyCredentials,
} from "@/lib/auth/config";

export async function POST(request: Request) {
  if (!isDummyAuthAllowed()) {
    return NextResponse.json(
      {
        error:
          "Login dummy tidak tersedia di mode produksi. Gunakan Login with Google.",
      },
      { status: 403 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid." },
      { status: 400 },
    );
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!validateDummyCredentials(username, password)) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ user: DUMMY_ADMIN_USER });
  response.cookies.set(DUMMY_COOKIE_NAME, DUMMY_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
