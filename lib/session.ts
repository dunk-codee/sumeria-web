import { jwtVerify, SignJWT } from "jose";

/** Cookie de sesión del panel: JWT HS256 firmado con AUTH_SECRET. Sin dependencias de Node. */
export const SESSION_COOKIE = "sumeria_admin";
export const SESSION_DAYS = 14;

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET falta o es muy corto (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.sub === "admin" && typeof payload.email === "string" ? { email: payload.email } : null;
  } catch {
    return null;
  }
}
