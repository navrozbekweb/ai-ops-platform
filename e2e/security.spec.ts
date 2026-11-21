import { expect, test } from "@playwright/test";
import { ACCOUNTS } from "./helpers";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Origin: "http://localhost:3100",
};

test.describe("login limiti", () => {
  test("muvaffaqiyatli kirishlar IP limitiga sanalmaydi", async ({ request }) => {
    // Bitta ofis (bitta IP) xodimlari ketma-ket kirishi mumkin: limit 20 ta xato urinishda.
    for (let i = 0; i < 25; i += 1) {
      const response = await request.post("/api/auth/login", {
        headers: JSON_HEADERS,
        data: { ...ACCOUNTS.employee, locale: "uz" },
      });
      expect(response.status()).toBe(200);
    }
  });

  test("bir hisobga 5 ta xato urinishdan keyin 429 va Retry-After", async ({
    request,
  }) => {
    const email = "lock-test@aiops.uz";
    for (let i = 0; i < 5; i += 1) {
      const response = await request.post("/api/auth/login", {
        headers: JSON_HEADERS,
        data: { email, password: "Wrong#Pass1", locale: "uz" },
      });
      expect(response.status()).toBe(401);
    }
    const blocked = await request.post("/api/auth/login", {
      headers: JSON_HEADERS,
      data: { email, password: "Wrong#Pass1", locale: "uz" },
    });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  });

  test("interfeysda bloklanish xabari ko'rinadi", async ({ page }) => {
    await page.goto("/uz/login");
    await page.getByLabel("Email").fill("lock-ui@aiops.uz");
    for (let i = 0; i < 6; i += 1) {
      await page.getByLabel("Parol", { exact: true }).fill("Wrong#Pass1");
      await page.getByRole("button", { name: "Kirish", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Kirish", exact: true }),
      ).toBeEnabled();
    }
    await expect(page.getByText("Juda ko'p urinish")).toBeVisible();
  });
});
