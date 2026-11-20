import { SignJWT, jwtVerify } from "jose";
import { isRole, type Role } from "./roles";

/**
 * JWT imzolash/tekshirish. Proxy (edge) va server ikkalasida ishlaydi.
 * Cookie bilan ishlash lib/auth/session.ts da (server-only).
 */
export const SESSION_COOKIE = "aiops_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 soat
export const RESET_TTL_SECONDS = 60 * 15; // 15 daqiqa

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  email: string;
  dept: string;
};

const ISSUER = "ai-ops-platform";
const DEV_FALLBACK_SECRET =
  "dev-only-insecure-secret-do-not-use-in-production-0123456789";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET kamida 32 belgidan iborat bo'lishi shart.");
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    name: payload.name,
    email: payload.email,
    dept: payload.dept,
    typ: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (payload.typ !== "session") return null;
    const { sub, role, name, email, dept } = payload as Record<string, unknown>;
    if (
      typeof sub !== "string" ||
      !isRole(role) ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof dept !== "string"
    ) {
      return null;
    }
    return { sub, role, name, email, dept };
  } catch {
    return null;
  }
}

export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ typ: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${RESET_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (payload.typ !== "reset" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
