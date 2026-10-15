import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminRequest,
  passwordsMatch
} from "@/lib/admin-auth";

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",").map((part) => part.trim()).filter(Boolean).at(-1);
  return address || request.headers.get("x-real-ip") || "unknown";
}

function getAttempt(clientKey: string, now: number) {
  if (loginAttempts.size > 1000) {
    for (const [key, value] of loginAttempts) {
      if (value.resetAt <= now) loginAttempts.delete(key);
    }
  }

  const attempt = loginAttempts.get(clientKey);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 0, resetAt: now + WINDOW_MS });
    return loginAttempts.get(clientKey)!;
  }

  return attempt;
}

export function GET(request: Request) {
  return NextResponse.json(
    { authenticated: isAdminRequest(request) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const token = createAdminSessionToken();

  if (!password || !token) {
    return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  }

  const now = Date.now();
  const attempt = getAttempt(getClientKey(request), now);
  if (attempt.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many sign-in attempts. Please wait and try again." }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1024) {
    return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });
  }

  const providedPassword =
    body !== null && typeof body === "object" && "password" in body ? body.password : undefined;
  if (typeof providedPassword !== "string" || !passwordsMatch(providedPassword, password)) {
    attempt.count += 1;
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  loginAttempts.delete(getClientKey(request));
  const response = NextResponse.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: 0
  });
  return response;
}
