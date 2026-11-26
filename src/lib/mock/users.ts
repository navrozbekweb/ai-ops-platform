import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/auth/roles";

/**
 * MOCK ma'lumotlar. Haqiqiy backend ulanganda bu fayl va MOCK_AUTH_ENABLED
 * o'zgaruvchisi olib tashlanadi, verifyCredentials() API chaqiruviga almashadi.
 */
export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  dept: string;
};

type StoredUser = MockUser & { salt: string; hash: Buffer };

export const DEMO_ACCOUNTS: ReadonlyArray<MockUser & { password: string }> = [
  {
    id: "u_admin",
    name: "Sanjar Rasulov",
    email: "admin@aiops.uz",
    role: "admin",
    dept: "Boshqaruv",
    password: "Admin#2026",
  },
  {
    id: "u_manager",
    name: "Malika Rahimova",
    email: "manager@aiops.uz",
    role: "manager",
    dept: "Moliya",
    password: "Manager#2026",
  },
  {
    id: "u_employee",
    name: "Dilshod Karimov",
    email: "employee@aiops.uz",
    role: "employee",
    dept: "Moliya",
    password: "Employee#2026",
  },
];

const KEY_LENGTH = 64;

function hashPassword(password: string, salt: string): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}

// Route handler va server komponentlar alohida bundle bo'lishi mumkin: holat globalThis'da saqlanadi.
const STORE_KEY = Symbol.for("aiops.mock.credentials");
type Holder = { [STORE_KEY]?: StoredUser[] };

function credentials(): StoredUser[] {
  const holder = globalThis as typeof globalThis & Holder;
  holder[STORE_KEY] ??= DEMO_ACCOUNTS.map(({ password, ...user }) => {
    const salt = randomBytes(16).toString("hex");
    return { ...user, salt, hash: hashPassword(password, salt) };
  });
  return holder[STORE_KEY];
}

// Foydalanuvchi topilmaganda ham vaqt bir xil ketishi uchun soxta yozuv.
const DUMMY_SALT = randomBytes(16).toString("hex");
const DUMMY_HASH = hashPassword("dummy-password-for-timing", DUMMY_SALT);

export function verifyCredentials(email: string, password: string): MockUser | null {
  const user = credentials().find((u) => u.email === email);
  const salt = user?.salt ?? DUMMY_SALT;
  const expected = user?.hash ?? DUMMY_HASH;
  const actual = hashPassword(password, salt);
  const match = timingSafeEqual(actual, expected);
  if (!user || !match) return null;
  const { salt: _salt, hash: _hash, ...safe } = user;
  void _salt;
  void _hash;
  return safe;
}

/** Mock rejimi: dev'da doim yoqiq, production'da faqat MOCK_AUTH_ENABLED=true bo'lsa. */
export function isMockAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.MOCK_AUTH_ENABLED === "true"
  );
}

/**
 * Joriy parolni tekshirib, yangisini o'rnatadi (faqat xotirada; server qayta ishga tushsa, demo parol qaytadi).
 * Haqiqiy backendda shu yerda API chaqiruvi bo'ladi.
 */
export function changePassword(userId: string, current: string, next: string): boolean {
  const user = credentials().find((u) => u.id === userId);
  if (!user) return false;
  const actual = hashPassword(current, user.salt);
  if (!timingSafeEqual(actual, user.hash)) return false;
  const salt = randomBytes(16).toString("hex");
  user.salt = salt;
  user.hash = hashPassword(next, salt);
  return true;
}
