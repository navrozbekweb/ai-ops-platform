import { expect, type Page } from "@playwright/test";

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
