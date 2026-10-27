import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS, verifySessionToken } from "./session";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Valida email y contraseña contra ADMIN_EMAIL / ADMIN_PASSWORD. */
export function checkCredentials(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL;
  const p = process.env.ADMIN_PASSWORD;
  if (!e || !p) return false;
  return safeEqual(email.trim().toLowerCase(), e.trim().toLowerCase()) && safeEqual(password, p);
}

export async function startSession(email: string) {
  const token = await createSessionToken(email);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Para Server Actions y páginas del panel: corta si no hay sesión. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
