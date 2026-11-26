import { expect, test, type Page } from "@playwright/test";

// /uz/profile barcha rollar uchun ochiq, shuning uchun har rolning ruxsat ro'yxatiga kiritilgan.
const ACCOUNTS = {
  admin: {
    email: "admin@aiops.uz",
    password: "Admin#2026",
    nav: ["/uz/users", "/uz/settings", "/uz/profile"],
  },
  manager: {
    email: "manager@aiops.uz",
    password: "Manager#2026",
    nav: ["/uz/team", "/uz/approvals", "/uz/profile"],
  },
  employee: {
    email: "employee@aiops.uz",
    password: "Employee#2026",
    nav: ["/uz/profile"],
  },
} as const;

async function login(page: Page, email: string, password: string) {
  await page.goto("/uz/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
}

test.describe("himoya", () => {
  test("sessiyasiz dashboard login'ga yo'naltiradi", async ({ page }) => {
    await page.goto("/uz/dashboard");
    await expect(page).toHaveURL(/\/uz\/login\?next=%2Fuz%2Fdashboard/);
  });

  test("root til prefiksiga yo'naltiradi", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/uz\/login/);
  });

  test("noto'g'ri parol xato ko'rsatadi va sessiya bermaydi", async ({ page }) => {
    await login(page, "admin@aiops.uz", "Wrong#Pass1");
    // Next.js'ning o'z route-announcer'i ham role="alert", shuning uchun matn bo'yicha qidiramiz.
    await expect(page.getByText("Email yoki parol noto'g'ri.")).toBeVisible();
    await expect(page).toHaveURL(/\/uz\/login/);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "aiops_session")).toBeUndefined();
  });

  test("bo'sh forma serverga yubormasdan xato ko'rsatadi", async ({ page }) => {
    await page.goto("/uz/login");
    await page.getByRole("button", { name: "Kirish", exact: true }).click();
    await expect(page.getByText("Emailni kiriting")).toBeVisible();
    await expect(page.getByText("Parolni kiriting")).toBeVisible();
  });

  test("tashqi manzilga open redirect ishlamaydi", async ({ page }) => {
    await page.goto("/uz/login?next=//evil.example");
    await page.getByLabel("Email").fill(ACCOUNTS.admin.email);
    await page.getByLabel("Parol", { exact: true }).fill(ACCOUNTS.admin.password);
    await page.getByRole("button", { name: "Kirish", exact: true }).click();
    await expect(page).toHaveURL(/localhost:3100\/uz\/dashboard/);
  });

  test("cookie httpOnly va API cross-origin so'rovni rad etadi", async ({
    page,
    request,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await expect(page).toHaveURL(/\/uz\/dashboard/);
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === "aiops_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");

    const forged = await request.post("/api/auth/login", {
      headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
      data: {
        email: ACCOUNTS.admin.email,
        password: ACCOUNTS.admin.password,
        locale: "uz",
      },
    });
    expect(forged.status()).toBe(403);
  });
});

for (const [role, account] of Object.entries(ACCOUNTS)) {
  test.describe(`rol: ${role}`, () => {
    test("email va parol bo'yicha rol aniqlanib, o'z paneliga kiradi", async ({
      page,
    }) => {
      await login(page, account.email, account.password);
      await expect(page).toHaveURL(/\/uz\/dashboard/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Xush kelibsiz",
      );
      await expect(
        page
          .getByRole("complementary")
          .getByText(/Admin|Rahbar|Xodim/)
          .first(),
      ).toBeVisible();
    });

    test("faqat o'z rolining bo'limlariga kira oladi", async ({ page }) => {
      await login(page, account.email, account.password);
      await expect(page).toHaveURL(/\/uz\/dashboard/);

      const allowed = new Set<string>(account.nav);
      for (const path of [
        "/uz/users",
        "/uz/settings",
        "/uz/team",
        "/uz/approvals",
        "/uz/profile",
      ]) {
        await page.goto(path);
        if (allowed.has(path)) {
          await expect(page).toHaveURL(new RegExp(`${path}$`));
        } else {
          await expect(page).toHaveURL(/\/uz\/dashboard$/);
        }
      }
    });

    test("chiqishdan keyin himoyalangan sahifa yopiladi", async ({ page }) => {
      await login(page, account.email, account.password);
      await expect(page).toHaveURL(/\/uz\/dashboard/);
      await page
        .getByRole("complementary")
        .getByRole("button", { name: "Chiqish" })
        .click();
      await expect(page).toHaveURL(/\/uz\/login/);
      await page.goto("/uz/dashboard");
      await expect(page).toHaveURL(/\/uz\/login/);
    });
  });
}

test.describe("parolni tiklash", () => {
  test("havola olinadi, yangi parol validatsiya qilinadi va saqlanadi", async ({
    page,
  }) => {
    await page.goto("/uz/forgot-password");
    await page.getByLabel("Email").fill("manager@aiops.uz");
    await page.getByRole("button", { name: "Havola yuborish" }).click();
    await expect(page.getByRole("status")).toContainText("tiklash havolasi yuborildi");
    await page.getByRole("link", { name: "Parolni tiklashni ochish" }).click();

    await page.getByLabel("Yangi parol", { exact: true }).fill("zaif");
    await page.getByLabel("Parolni takrorlang", { exact: true }).fill("boshqa");
    await page.getByRole("button", { name: "Parolni saqlash" }).click();
    await expect(
      page.getByText("Kamida 8 belgi: katta, kichik harf va raqam"),
    ).toBeVisible();

    await page.getByLabel("Yangi parol", { exact: true }).fill("Yangi#Parol1");
    await page.getByLabel("Parolni takrorlang", { exact: true }).fill("Yangi#Parol2");
    await page.getByRole("button", { name: "Parolni saqlash" }).click();
    await expect(page.getByText("Parollar mos kelmadi")).toBeVisible();

    await page.getByLabel("Parolni takrorlang", { exact: true }).fill("Yangi#Parol1");
    await page.getByRole("button", { name: "Parolni saqlash" }).click();
    await expect(page.getByRole("status")).toContainText("Parol yangilandi");
  });

  test("yaroqsiz token rad etiladi", async ({ page }) => {
    await page.goto("/uz/reset-password?token=yaroqsiz-token-123");
    await page.getByLabel("Yangi parol", { exact: true }).fill("Yangi#Parol1");
    await page.getByLabel("Parolni takrorlang", { exact: true }).fill("Yangi#Parol1");
    await page.getByRole("button", { name: "Parolni saqlash" }).click();
    await expect(page.getByText("Havola yaroqsiz yoki muddati tugagan.")).toBeVisible();
  });
});

test.describe("til va mavzu", () => {
  test("til almashtirish yo'lni saqlab, matnni o'zgartiradi", async ({ page }) => {
    await page.goto("/uz/login");
    await page.getByRole("button", { name: "ru", exact: true }).click();
    await expect(page).toHaveURL(/\/ru\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Вход в систему");
    await page.getByRole("button", { name: "en", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  });

  test("tungi rejim sinf qo'shadi va yangilashdan keyin saqlanadi", async ({ page }) => {
    await page.goto("/uz/login");
    await page.getByRole("button", { name: "Tungi" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Yorug'" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

test.describe("responsive", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("telefonda gorizontal scroll yo'q va menyu ochiladi", async ({ page }) => {
    await login(page, ACCOUNTS.manager.email, ACCOUNTS.manager.password);
    await expect(page).toHaveURL(/\/uz\/dashboard/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Menyu", exact: true }).click();
    await expect(page.getByRole("link", { name: "Tasdiqlash" })).toBeVisible();
  });
});
