import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("sidebar", () => {
  test("admin: uch guruh va ma'muriyat bo'limlari ko'rinadi", async ({ page }) => {
    await loginAs(page, "admin");
    const aside = page.getByRole("complementary");
    for (const group of ["Umumiy", "Ish", "Ma'muriyat"]) {
      await expect(aside.getByText(group, { exact: true })).toBeVisible();
    }
    for (const link of ["Foydalanuvchilar", "Rollar va huquqlar", "Audit jurnali"]) {
      await expect(aside.getByRole("link", { name: link })).toBeVisible();
    }
  });

  test("rahbar: ma'muriyat guruhi yo'q, tasdiqlash bor", async ({ page }) => {
    await loginAs(page, "manager");
    const aside = page.getByRole("complementary");
    await expect(aside.getByText("Ma'muriyat", { exact: true })).toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Foydalanuvchilar" })).toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Tasdiqlash" })).toBeVisible();
    await expect(aside.getByRole("link", { name: "Mening jamoam" })).toBeVisible();
  });

  test("xodim: faqat o'z bo'limlari", async ({ page }) => {
    await loginAs(page, "employee");
    const aside = page.getByRole("complementary");
    await expect(aside.getByRole("link", { name: "Vazifalar" })).toBeVisible();
    await expect(aside.getByRole("link", { name: "Korxona tahlili" })).toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Tasdiqlash" })).toHaveCount(0);
  });

  test("joriy sahifa aria-current bilan belgilanadi", async ({ page }) => {
    await loginAs(page, "manager");
    const aside = page.getByRole("complementary");
    await aside.getByRole("link", { name: "Vazifalar" }).click();
    await expect(page).toHaveURL(/\/uz\/tasks$/);
    await expect(aside.getByRole("link", { name: "Vazifalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      aside.getByRole("link", { name: "Boshqaruv paneli" }),
    ).not.toHaveAttribute("aria-current", "page");
  });

  test("yig'ish holati yangilashdan keyin ham saqlanadi", async ({ page }) => {
    await loginAs(page, "admin");
    const aside = page.getByRole("complementary");
    const expanded = (await aside.boundingBox())!.width;
    expect(expanded).toBeGreaterThan(200);

    await aside.getByRole("button", { name: "Menyuni yig'ish", exact: true }).click();
    await expect.poll(async () => (await aside.boundingBox())!.width).toBeLessThan(100);
    await expect(aside.getByRole("link", { name: "Foydalanuvchilar" })).toHaveAttribute(
      "title",
      "Foydalanuvchilar",
    );

    await page.reload();
    await expect.poll(async () => (await aside.boundingBox())!.width).toBeLessThan(100);
    await aside.getByRole("button", { name: "Menyuni yoyish", exact: true }).click();
    await expect
      .poll(async () => (await aside.boundingBox())!.width)
      .toBeGreaterThan(200);
  });
});

test.describe("header", () => {
  test("breadcrumb joriy bo'limni ko'rsatadi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/users");
    const crumbs = page.getByRole("navigation", { name: "Joriy yo'l" });
    await expect(crumbs.getByRole("link", { name: "Boshqaruv paneli" })).toBeVisible();
    await expect(crumbs.getByText("Foydalanuvchilar")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("bildirishnomalar: sanoq, o'qilgan deb belgilash, Escape fokusni qaytaradi", async ({
    page,
  }) => {
    await loginAs(page, "manager");
    const bell = page.getByRole("button", { name: "Bildirishnomalar, o'qilmagan: 3" });
    await bell.click();
    const panel = page.getByRole("dialog", { name: /Bildirishnomalar/ });
    await expect(panel.getByText("Tasdiq kutilmoqda")).toBeVisible();

    await panel.getByRole("button", { name: "Tasdiq kutilmoqda" }).click();
    await expect(
      page.getByRole("button", { name: "Bildirishnomalar, o'qilmagan: 2" }),
    ).toBeVisible();

    await panel.getByRole("button", { name: "Hammasini o'qilgan deb belgilash" }).click();
    await expect(
      page.getByRole("button", { name: "Bildirishnomalar, o'qilmagan: 0" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Bildirishnomalar/ })).toBeFocused();
  });

  test("profil menyusi: til, mavzu va chiqish", async ({ page }) => {
    await loginAs(page, "employee");
    await page.getByRole("button", { name: "Hisob menyusi" }).click();
    const menu = page.getByRole("dialog", { name: "Hisob menyusi" });
    await expect(menu.getByText("employee@aiops.uz")).toBeVisible();

    await menu.getByRole("button", { name: "Tungi" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await menu.getByRole("button", { name: "ru", exact: true }).click();
    await expect(page).toHaveURL(/\/ru\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Добро пожаловать",
    );
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Меню аккаунта" }).click();
    await page
      .getByRole("dialog", { name: "Меню аккаунта" })
      .getByRole("button", { name: "Выйти" })
      .click();
    await expect(page).toHaveURL(/\/ru\/login/);
  });

  test("skip-link klaviatura bilan asosiy kontentga o'tadi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Asosiy kontentga o'tish" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("tezkor qidiruv (Ctrl+K)", () => {
  test("ochiladi, qidiradi va Enter bilan sahifaga o'tkazadi", async ({ page }) => {
    await loginAs(page, "manager");
    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Tezkor qidiruv" });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole("combobox")).toBeFocused();

    await palette.getByRole("combobox").fill("vazif");
    await expect(palette.getByRole("option", { name: "Vazifalar" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/uz\/tasks$/);
    await expect(palette).toBeHidden();
  });

  test("strelka tugmalari tanlovni o'zgartiradi", async ({ page }) => {
    await loginAs(page, "manager");
    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Tezkor qidiruv" });
    await expect(palette.getByRole("option").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("ArrowDown");
    await expect(palette.getByRole("option").nth(1)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();
  });

  test("faqat rolga ruxsat etilgan sahifalarni ko'rsatadi", async ({ page }) => {
    await loginAs(page, "manager");
    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Tezkor qidiruv" });
    await palette.getByRole("combobox").fill("foydalanuvchi");
    await expect(palette.getByText("Hech narsa topilmadi")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.context().clearCookies();
    await loginAs(page, "admin");
    await page.keyboard.press("Control+K");
    await page.getByRole("combobox").fill("foydalanuvchi");
    await expect(page.getByRole("option", { name: "Foydalanuvchilar" })).toBeVisible();
  });

  test("amal: tungi rejimga o'tish", async ({ page }) => {
    await loginAs(page, "employee");
    await page.getByRole("button", { name: "Qidirish", exact: true }).click();
    await page.getByRole("combobox").fill("tungi");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("xato holatlari", () => {
  test("mavjud bo'lmagan sahifa panel ichida 404 ko'rsatadi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/yoq-sahifa");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sahifa topilmadi");
    await expect(page.getByRole("complementary")).toBeVisible();
    await page.getByRole("link", { name: "Boshqaruv paneliga qaytish" }).click();
    await expect(page).toHaveURL(/\/uz\/dashboard$/);
  });
});

test.describe("telefon (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sarlavha sig'adi, pop-over va qidiruv ekrandan chiqib ketmaydi", async ({
    page,
  }) => {
    await loginAs(page, "manager");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: /Bildirishnomalar/ }).click();
    const panel = page.getByRole("dialog", { name: /Bildirishnomalar/ });
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Qidirish", exact: true }).click();
    const palette = page.getByRole("dialog", { name: "Tezkor qidiruv" });
    const pbox = (await palette.boundingBox())!;
    expect(pbox.x).toBeGreaterThanOrEqual(0);
    expect(pbox.x + pbox.width).toBeLessThanOrEqual(390);
  });

  test("yon menyu guruhlar bilan ochiladi va havola bosilganda yopiladi", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await page.getByRole("button", { name: "Menyu", exact: true }).click();
    const nav = page.getByRole("navigation", { name: "Asosiy menyu" });
    await expect(nav.getByText("Ma'muriyat", { exact: true })).toBeVisible();
    await nav.getByRole("link", { name: "Audit jurnali" }).click();
    await expect(page).toHaveURL(/\/uz\/audit$/);
    await expect(nav).toBeHidden();
  });
});
