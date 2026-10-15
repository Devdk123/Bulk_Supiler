import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "bulk_supplier_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getSessionSignature(expiresAt: number) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;

  if (!secret || secret.length < 32 || !password) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(`bulk-supplier-admin:${password}:${expiresAt}`)
    .digest("base64url");
}

export function createAdminSessionToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE;
  const signature = getSessionSignature(expiresAt);

  return signature ? `${expiresAt}.${signature}` : null;
}

export function isAdminRequest(request: Request, now = Date.now()) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!cookie) {
    return false;
  }

  const token = cookie.slice(ADMIN_SESSION_COOKIE.length + 1);
  const [expiresText, providedSignature, extra] = token.split(".");
  const expiresAt = Number(expiresText);

  if (
    extra !== undefined ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    expiresAt > Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE
  ) {
    return false;
  }

  const expectedSignature = getSessionSignature(expiresAt);
  if (!expectedSignature || !providedSignature) {
    return false;
  }

  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function passwordsMatch(providedPassword: string, expectedPassword: string) {
  const provided = Buffer.from(providedPassword);
  const expected = Buffer.from(expectedPassword);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
