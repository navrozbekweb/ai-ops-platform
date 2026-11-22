import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { navItemsFor, type Role } from "../src/lib/auth/roles";
import { loginAs } from "./helpers";

const ROLES: Role[] = ["admin", "manager", "employee"];
const THEMES = ["light", "dark"] as const;

/** `within` berilsa, faqat shu qism tekshiriladi (ochiq overlay ostidagi sahifa qismi emas). */
async function scan(page: Page, label: string, within?: string) {
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  if (within) builder.include(within);
  const results = await builder.analyze();
  const summary = results.violations.map(
    (v) =>
      `${label}: ${v.id} (${v.impact}) ${v.help}\n` +
      v.nodes
        .slice(0, 3)
        .map(
          (n) => `   ${n.target.join(" ")}\n   ${n.failureSummary?.split("\n")[1] ?? ""}`,
        )
        .join("\n"),
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

test.describe("qulaylik (axe, WCAG 2.2 AA)", () => {
  for (const role of ROLES) {
    for (const theme of THEMES) {
      test(`${role}: barcha sahifalar, ${theme} rejim`, async ({
        page,
        context,
        baseURL,
      }) => {
        await context.addCookies([{ name: "aiops_theme", value: theme, url: baseURL! }]);
        await loginAs(page, role);
        const sections = [...new Set([...navItemsFor(role), "profile"])];
        for (const section of sections) {
          await page.goto(`/uz/${section}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await page.getByRole("main").waitFor();
          await scan(page, `${role}/${theme}/${section}`);
        }
      });
    }
  }

  for (const locale of ["uz", "ru", "en"]) {
    for (const theme of THEMES) {
      test(`ochiq sahifalar: ${locale}, ${theme} rejim`, async ({
        page,
        context,
        baseURL,
      }) => {
        await context.addCookies([{ name: "aiops_theme", value: theme, url: baseURL! }]);
        for (const path of ["login", "forgot-password"]) {
          await page.goto(`/${locale}/${path}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await scan(page, `${locale}/${theme}/${path}`);
        }
      });
    }
  }

  test("ochiq oyna: modal, bildirishnoma va qidiruv axe'dan o'tadi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/users");
    await page.getByRole("button", { name: "Foydalanuvchi qo'shish" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page, "modal", "dialog[open]");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Bildirishnomalar/ }).click();
    await scan(page, "bildirishnomalar", '[role="dialog"]');
    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+K");
    await scan(page, "qidiruv", "dialog[open]");
  });
});
