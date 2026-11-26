import {
  expect,
  type Browser,
  type Page,
  type PlaywrightWorkerArgs,
} from "@playwright/test";

export const ACCOUNTS = {
  admin: { email: "admin@aiops.uz", password: "Admin#2026" },
  manager: { email: "manager@aiops.uz", password: "Manager#2026" },
  employee: { email: "employee@aiops.uz", password: "Employee#2026" },
} as const;

export type RoleName = keyof typeof ACCOUNTS;

/** Login formasini to'ldirib, bosh sahifa ochilishini kutadi. */
export async function loginAs(page: Page, role: RoleName, locale = "uz") {
  const { email, password } = ACCOUNTS[role];
  await page.goto(`/${locale}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`));
}

export const BASE_URL = "http://localhost:3100";

/** Alohida brauzer konteksti (alohida cookie'lar) ochib, shu rol bilan kiradi. */
export async function newSession(browser: Browser, role: RoleName, locale = "uz") {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await loginAs(page, role, locale);
  return { context, page };
}

/** API so'rovlari uchun rol sessiyasi (cookie saqlanadi). */
export async function apiAs(
  playwright: PlaywrightWorkerArgs["playwright"],
  role: RoleName,
) {
  const ctx = await playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
  const response = await ctx.post("/api/auth/login", {
    data: { ...ACCOUNTS[role], locale: "uz" },
  });
  expect(response.status()).toBe(200);
  return ctx;
}

export async function apiAnonymous(playwright: PlaywrightWorkerArgs["playwright"]) {
  return playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
}
