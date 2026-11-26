import { expect, test } from "@playwright/test";
import { ACCOUNTS, apiAnonymous, apiAs, loginAs, newSession } from "./helpers";

/**
 * Hafta 5 bo'limlari: profil, hujjatlar, AI yordamchi, tahlil, audit, sozlamalar, rollar.
 * Server holati testlar orasida umumiy, shuning uchun o'zgartirilgan narsa oxirida qaytariladi.
 */
test.describe("profil", () => {
  test("ism o'zgartiriladi va sarlavhada ko'rinadi", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/profile");
    await expect(page.getByRole("heading", { level: 1, name: "Profil" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeDisabled();

    const name = page.getByLabel("To'liq ism");
    await name.fill("Dilmurod Karimov");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Profil yangilandi")).toBeVisible();
    await page.goto("/uz/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dilmurod");
    await page.goto("/uz/profile");

    await page.getByLabel("To'liq ism").fill("Dilshod Karimov");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Profil yangilandi").first()).toBeVisible();
  });

  test("noto'g'ri joriy parol xato beradi, to'g'risi parolni almashtiradi", async ({
    browser,
    playwright,
  }) => {
    const { page, context } = await newSession(browser, "manager");
    await page.goto("/uz/profile");

    await page.getByLabel("Joriy parol").fill("Wrong#Pass1");
    await page.getByLabel(/^Yangi parol\*?$/).fill("Yangi#Parol1");
    await page.getByLabel("Yangi parolni takrorlang").fill("Yangi#Parol1");
    await page.getByRole("button", { name: "Parolni yangilash" }).click();
    await expect(page.getByText("Joriy parol noto'g'ri.")).toBeVisible();

    // Parollar mos kelmasa, so'rov yuborilmaydi.
    await page.getByLabel("Joriy parol").fill(ACCOUNTS.manager.password);
    await page.getByLabel("Yangi parolni takrorlang").fill("Boshqa#Parol1");
    await page.getByRole("button", { name: "Parolni yangilash" }).click();
    await expect(page.getByText("Parollar mos kelmadi")).toBeVisible();

    await page.getByLabel("Yangi parolni takrorlang").fill("Yangi#Parol1");
    await page.getByRole("button", { name: "Parolni yangilash" }).click();
    await expect(page.getByText("Parol yangilandi")).toBeVisible();

    // Yangi parol bilan kiriladi, eskisi bilan kirib bo'lmaydi.
    const anon = await apiAnonymous(playwright);
    const old = await anon.post("/api/auth/login", {
      data: { ...ACCOUNTS.manager, locale: "uz" },
    });
    expect(old.status()).toBe(401);
    const fresh = await anon.post("/api/auth/login", {
      data: { email: ACCOUNTS.manager.email, password: "Yangi#Parol1", locale: "uz" },
    });
    expect(fresh.status()).toBe(200);

    // Boshqa testlar buzilmasligi uchun parol qaytariladi.
    const back = await context.request.post("/api/profile/password", {
      data: {
        current: "Yangi#Parol1",
        password: ACCOUNTS.manager.password,
        confirm: ACCOUNTS.manager.password,
      },
      headers: { Origin: "http://localhost:3100" },
    });
    expect(back.status()).toBe(200);
    await context.close();
  });

  test("zaif parol serverda ham rad etiladi", async ({ playwright }) => {
    const api = await apiAs(playwright, "employee");
    const response = await api.post("/api/profile/password", {
      data: { current: ACCOUNTS.employee.password, password: "short", confirm: "short" },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("hujjatlar", () => {
  test("xodim faqat o'zining va umumiy hujjatlarni ko'radi", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/documents");
    await expect(page.getByText("Ichki tartib qoidalari")).toBeVisible(); // umumiy
    await expect(page.getByText("Yetkazib beruvchi shartnomasi").first()).toBeVisible(); // o'ziniki
    await expect(page.getByText("Oktyabr moliyaviy hisoboti")).toHaveCount(0); // rahbarniki
    await expect(page.getByText("Savdo prognozi Q1")).toHaveCount(0);
  });

  test("hujjat qo'shiladi va o'chiriladi", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/documents");

    await page.getByRole("button", { name: "Hujjat qo'shish" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(dialog.getByText("Sarlavhani kiriting")).toBeVisible();

    await dialog.getByLabel("Sarlavha").fill("E2E sinov hujjati");
    await dialog.getByLabel("Turi").selectOption("policy");
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(page.getByText("Hujjat qo'shildi")).toBeVisible();
    await expect(page.getByText("E2E sinov hujjati")).toBeVisible();

    await page.getByRole("button", { name: "O'chirish: E2E sinov hujjati" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "O'chirish", exact: true })
      .click();
    await expect(page.getByText("Hujjat o'chirildi")).toBeVisible();
    await expect(page.getByText("E2E sinov hujjati")).toHaveCount(0);
  });

  test("boshqaning hujjatini o'chirib bo'lmaydi (server tekshiruvi)", async ({
    playwright,
  }) => {
    const api = await apiAs(playwright, "employee");
    // d_1: admin egasi, umumiy: ko'rinadi, lekin o'chirib bo'lmaydi.
    expect((await api.delete("/api/docs/d_1")).status()).toBe(403);
    // d_3: rahbarning shaxsiy hujjati: xodim uchun mavjud emas.
    expect((await api.delete("/api/docs/d_3")).status()).toBe(404);
    const list = await (await api.get("/api/docs")).json();
    expect(list.docs.some((d: { id: string }) => d.id === "d_3")).toBe(false);
  });

  test("rahbar jamoa a'zosining shaxsiy hujjatini ko'radi", async ({ playwright }) => {
    const api = await apiAs(playwright, "manager");
    const list = await (await api.get("/api/docs")).json();
    const ids = list.docs.map((d: { id: string }) => d.id);
    expect(ids).toContain("d_5"); // Dilshod (jamoa a'zosi) shaxsiy hujjati
    expect(ids).not.toContain("d_4"); // boshqa rahbarning shaxsiy hujjati
  });
});

test.describe("AI yordamchi", () => {
  test("tezkor savolga o'z ma'lumotlari asosida javob beradi", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/ai");
    const log = page.getByRole("log", { name: "Suhbat" });
    await expect(log).toContainText("Salom!");

    await page.getByRole("button", { name: "Mening vazifalarim" }).click();
    await expect(log).toContainText("faol vazifa bor");

    await page.getByLabel("Savolingiz").fill("kechikkan ishlar qaysilar?");
    await page.getByRole("button", { name: "Yuborish" }).click();
    await expect(log).toContainText("Muddati o'tgan vazifalar");
  });

  test("administrator o'chirsa, chat yopiladi va API 409 beradi", async ({
    playwright,
    browser,
  }) => {
    const admin = await apiAs(playwright, "admin");
    const off = await admin.patch("/api/settings", {
      data: { companyName: "AI Ops", aiEnabled: false, emailNotifications: true },
    });
    expect(off.status()).toBe(200);

    try {
      const employee = await apiAs(playwright, "employee");
      const blocked = await employee.post("/api/ai/chat", {
        data: { message: "salom", locale: "uz" },
      });
      expect(blocked.status()).toBe(409);

      const { page, context } = await newSession(browser, "employee");
      await page.goto("/uz/ai");
      await expect(page.getByText("AI yordamchi o'chirilgan")).toBeVisible();
      await context.close();
    } finally {
      await admin.patch("/api/settings", {
        data: { companyName: "AI Ops", aiEnabled: true, emailNotifications: true },
      });
    }
  });

  test("javob foydalanuvchi tilida qaytadi, bo'sh xabar rad etiladi", async ({
    playwright,
  }) => {
    const api = await apiAs(playwright, "employee");
    const en = await (
      await api.post("/api/ai/chat", { data: { message: "help", locale: "en" } })
    ).json();
    expect(en.reply).toContain("I can tell you");
    const empty = await api.post("/api/ai/chat", {
      data: { message: "  ", locale: "uz" },
    });
    expect(empty.status()).toBe(400);
  });
});

test.describe("tahlil, audit, sozlamalar, rollar", () => {
  test("tahlil: rahbar va admin ko'radi, xodim yo'naltiriladi", async ({
    page,
    browser,
  }) => {
    await loginAs(page, "manager");
    await page.goto("/uz/analytics");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Korxona tahlili");
    await expect(page.getByText("Jami vazifalar")).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Xodimlar bo'yicha vazifalar" }),
    ).toBeVisible();

    const { page: employee, context } = await newSession(browser, "employee");
    await employee.goto("/uz/analytics");
    await expect(employee).toHaveURL(/\/uz\/dashboard$/);
    await context.close();
  });

  test("audit: amallar jurnalga tushadi, faqat admin ko'radi", async ({
    playwright,
    browser,
  }) => {
    const employee = await apiAs(playwright, "employee");
    const created = await employee.post("/api/docs", {
      data: {
        title: "Audit sinov hujjati",
        category: "other",
        description: "",
        shared: false,
      },
    });
    expect(created.status()).toBe(200);
    const { doc } = await created.json();

    const { page, context } = await newSession(browser, "admin");
    await page.goto("/uz/audit");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Audit jurnali");
    await expect(page.getByText("Audit sinov hujjati")).toBeVisible();
    await expect(page.getByText("Dilshod Karimov").first()).toBeVisible();
    await context.close();

    await employee.delete(`/api/docs/${doc.id}`);

    const { page: mgr, context: mctx } = await newSession(browser, "manager");
    await mgr.goto("/uz/audit");
    await expect(mgr).toHaveURL(/\/uz\/dashboard$/);
    await mctx.close();
  });

  test("sozlamalar: admin saqlaydi, boshqalar o'zgartira olmaydi", async ({
    page,
    playwright,
  }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/settings");
    const company = page.getByLabel("Kompaniya nomi");
    await company.fill("E2E Kompaniya");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Sozlamalar saqlandi")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Kompaniya nomi")).toHaveValue("E2E Kompaniya");
    await page.getByLabel("Kompaniya nomi").fill("AI Ops");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Sozlamalar saqlandi").first()).toBeVisible();

    for (const role of ["manager", "employee"] as const) {
      const api = await apiAs(playwright, role);
      const response = await api.patch("/api/settings", {
        data: { companyName: "Hack", aiEnabled: false, emailNotifications: false },
      });
      expect(response.status()).toBe(403);
    }
  });

  test("rollar matritsasi barcha bo'limlarni ko'rsatadi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/roles");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Rollar va huquqlar",
    );
    const table = page.getByRole("table", { name: "Rollar va bo'limlar matritsasi" });
    await expect(table.getByRole("row")).toHaveCount(13); // sarlavha + 12 bo'lim
    const row = table.getByRole("row", { name: /^Audit jurnali/ });
    await expect(row.getByRole("img", { name: "Ruxsat bor" })).toHaveCount(1);
    await expect(row.getByRole("img", { name: "Ruxsat yo'q" })).toHaveCount(2);
  });
});
