import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, loginAs, newSession } from "./helpers";

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

async function openUsers(page: Page) {
  await loginAs(page, "admin");
  await page.goto("/uz/users");
  await expect(
    page.getByRole("heading", { level: 1, name: "Foydalanuvchilar" }),
  ).toBeVisible();
}

test.describe("foydalanuvchilar jadvali", () => {
  test("rolsiz sahifaga kirish bosh sahifaga qaytaradi", async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto("/uz/users");
    await expect(page).toHaveURL(/\/uz\/dashboard$/);
    await page.goto("/uz/approvals");
    await expect(page).toHaveURL(/\/uz\/approvals$/);
  });

  test("qidiruv, bo'sh natija va tozalash", async ({ page }) => {
    await openUsers(page);
    await expect(rowFor(page, "Nodira Yusupova")).toBeVisible();

    await page.getByRole("searchbox", { name: "Qidirish" }).fill("nodira");
    await expect(rowFor(page, "Nodira Yusupova")).toBeVisible();
    await expect(rowFor(page, "Bobur Aliyev")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "ta natija" })).toHaveText(
      "1 ta natija",
    );

    await page.getByRole("searchbox", { name: "Qidirish" }).fill("zzzzzz");
    await expect(page.getByText("Hech narsa topilmadi")).toBeVisible();
    await page.getByRole("button", { name: "Qidiruvni tozalash" }).click();
    await expect(rowFor(page, "Bobur Aliyev")).toBeVisible();
  });

  test("saralash: aria-sort va tartib o'zgaradi", async ({ page }) => {
    await openUsers(page);
    const header = page.getByRole("columnheader", { name: /Foydalanuvchi/ });
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    const first = async () =>
      page
        .locator("tbody tr")
        .first()
        .locator("td")
        .first()
        .locator("span")
        .first()
        .innerText();
    const asc = await first();

    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    expect(await first()).not.toBe(asc);

    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "none");
  });

  test("sahifalash va sahifadagi qatorlar soni", async ({ page }) => {
    await openUsers(page);
    await expect(page.getByText(/^1–10 \/ \d+$/)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await expect(page.getByRole("button", { name: "Oldingi sahifa" })).toBeDisabled();

    await page.getByRole("button", { name: "Keyingi sahifa" }).click();
    await expect(page.getByText(/^11–\d+ \/ \d+$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Keyingi sahifa" })).toBeDisabled();

    await page.getByLabel("Sahifada").selectOption("25");
    await expect(page.getByText(/^1–\d+ \/ \d+$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Keyingi sahifa" })).toBeDisabled();
  });

  test("rol bo'yicha filtr", async ({ page }) => {
    await openUsers(page);
    await page.getByLabel(/^Rol\b/).selectOption("manager");
    await expect(rowFor(page, "Malika Rahimova")).toBeVisible();
    await expect(rowFor(page, "Nodira Yusupova")).toHaveCount(0);
  });

  test("o'z qatorida bloklash va o'chirish tugmalari yo'q", async ({ page }) => {
    await openUsers(page);
    await page.getByRole("searchbox", { name: "Qidirish" }).fill("admin@aiops.uz");
    const own = rowFor(page, "admin@aiops.uz");
    await expect(own.getByRole("button", { name: /Tahrirlash/ })).toBeVisible();
    await expect(own.getByRole("button", { name: /Bloklash/ })).toHaveCount(0);
    await expect(own.getByRole("button", { name: /O'chirish/ })).toHaveCount(0);
  });
});

test.describe("foydalanuvchi qo'shish, tahrirlash, o'chirish", () => {
  test("forma tekshiruvi, yaratish, takroriy email, tahrirlash va o'chirish", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e.${stamp}@aiops.uz`;
    const name = `Test Xodim ${stamp}`;
    await openUsers(page);

    const addButton = page.getByRole("button", { name: "Foydalanuvchi qo'shish" });
    await addButton.click();
    const dialog = page.getByRole("dialog", { name: "Yangi foydalanuvchi" });
    await expect(dialog).toBeVisible();
    // Ochilganda fokus birinchi maydonda.
    await expect(dialog.getByLabel("To'liq ism")).toBeFocused();

    // Bo'sh yuborish: serverga bormasdan xatolar.
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(dialog.getByText("Ismni kiriting (kamida 2 belgi)")).toBeVisible();
    await expect(dialog.getByText("Emailni kiriting")).toBeVisible();
    await expect(dialog.getByText("Bo'limni kiriting")).toBeVisible();

    // Xodim roli: rahbar tanlovi ko'rinadi, admin roli: yo'q.
    await expect(dialog.getByLabel("Rahbar")).toBeVisible();
    await dialog.getByLabel(/^Rol\b/).selectOption("admin");
    await expect(dialog.getByLabel("Rahbar")).toHaveCount(0);
    await dialog.getByLabel(/^Rol\b/).selectOption("employee");

    await dialog.getByLabel("To'liq ism").fill(name);
    await dialog.getByLabel("Email").fill("noto'g'ri");
    await dialog.getByLabel("Bo'lim").fill("Marketing");
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(dialog.getByText("Email noto'g'ri")).toBeVisible();

    // Mavjud email.
    await dialog.getByLabel("Email").fill(ACCOUNTS.admin.email);
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(dialog.getByText("Bu email allaqachon ro'yxatda")).toBeVisible();

    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Rahbar").selectOption({ label: "Malika Rahimova" });
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(`${name} qo'shildi`)).toBeVisible();
    // Fokus ochgan tugmaga qaytdi.
    await expect(addButton).toBeFocused();

    await page.getByRole("searchbox", { name: "Qidirish" }).fill(String(stamp));
    const row = rowFor(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByText("Moliya")).toHaveCount(0);

    // Tahrirlash: email o'zgarmaydi.
    await row.getByRole("button", { name: `Tahrirlash: ${name}` }).click();
    const edit = page.getByRole("dialog", { name: "Foydalanuvchini tahrirlash" });
    await expect(edit.getByLabel("Email")).toBeDisabled();
    await edit.getByLabel("Bo'lim").fill("Savdo");
    await edit.getByRole("button", { name: "Saqlash" }).click();
    await expect(edit).toBeHidden();
    await expect(rowFor(page, name).getByText("Savdo")).toBeVisible();

    // O'chirish tasdiqlash bilan.
    await rowFor(page, name)
      .getByRole("button", { name: `O'chirish: ${name}` })
      .click();
    const confirm = page.getByRole("dialog", { name: "Foydalanuvchini o'chiramizmi?" });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Bekor qilish" }).click();
    await expect(rowFor(page, name)).toBeVisible();

    await rowFor(page, name)
      .getByRole("button", { name: `O'chirish: ${name}` })
      .click();
    await page
      .getByRole("dialog", { name: "Foydalanuvchini o'chiramizmi?" })
      .getByRole("button", { name: "O'chirish" })
      .click();
    await expect(page.getByText(`${name} o'chirildi`)).toBeVisible();
    await expect(rowFor(page, name)).toHaveCount(0);
  });

  test("yakunlanmagan vazifasi bor foydalanuvchini o'chirib bo'lmaydi", async ({
    page,
  }) => {
    await openUsers(page);
    await page.getByRole("searchbox", { name: "Qidirish" }).fill("Aziz Tursunov");
    await rowFor(page, "Aziz Tursunov")
      .getByRole("button", { name: /O'chirish:/ })
      .click();
    const confirm = page.getByRole("dialog", { name: "Foydalanuvchini o'chiramizmi?" });
    await confirm.getByRole("button", { name: "O'chirish" }).click();
    await expect(confirm.getByRole("alert")).toContainText("yakunlanmagan vazifalar");
    // Oyna ochiq qoladi, foydalanuvchi o'chmagan.
    await confirm.getByRole("button", { name: "Bekor qilish" }).click();
    await expect(rowFor(page, "Aziz Tursunov")).toBeVisible();
  });

  test("bloklash va qayta faollashtirish", async ({ page }) => {
    await openUsers(page);
    const name = "Madina Sodiqova";
    await page.getByRole("searchbox", { name: "Qidirish" }).fill(name);

    await rowFor(page, name)
      .getByRole("button", { name: `Bloklash: ${name}` })
      .click();
    await page
      .getByRole("dialog", { name: "Hisobni bloklaymizmi?" })
      .getByRole("button", { name: "Bloklash" })
      .click();
    await expect(rowFor(page, name).getByText("Bloklangan")).toBeVisible();

    await rowFor(page, name)
      .getByRole("button", { name: `Blokdan chiqarish: ${name}` })
      .click();
    await expect(rowFor(page, name).getByText("Faol", { exact: true })).toBeVisible();
  });
});

test.describe("modal oyna", () => {
  test("klaviatura: Tab ichkarida qoladi, Esc yopadi, orqa fonni bosish yopadi", async ({
    page,
  }) => {
    await openUsers(page);
    const trigger = page.getByRole("button", { name: "Foydalanuvchi qo'shish" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Yangi foydalanuvchi" });
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press("Tab");
      // Fokus modal ichida qoladi; oxirgi elementdan keyin brauzer paneliga chiqishi mumkin
      // (activeElement = body), lekin orqadagi sahifaga hech qachon o'tmaydi.
      const state = await page.evaluate(() => {
        const active = document.activeElement;
        return active === document.body || active?.closest("dialog") != null;
      });
      expect(state).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // orqa fon
    await expect(dialog).toBeHidden();
  });

  test("blokli foydalanuvchi kira olmaydi, mavjud sessiyasi tugaydi", async ({
    page,
    browser,
  }) => {
    const employee = await newSession(browser, "employee");
    try {
      await openUsers(page);
      const name = "Dilshod Karimov";
      await page.getByRole("searchbox", { name: "Qidirish" }).fill(name);
      await rowFor(page, name)
        .getByRole("button", { name: `Bloklash: ${name}` })
        .click();
      await page
        .getByRole("dialog", { name: "Hisobni bloklaymizmi?" })
        .getByRole("button", { name: "Bloklash" })
        .click();
      await expect(rowFor(page, name).getByText("Bloklangan")).toBeVisible();

      // Ochiq sessiya keyingi o'tishda yopiladi.
      await employee.page.goto("/uz/tasks");
      await expect(employee.page).toHaveURL(/\/uz\/login/);
      await expect(employee.page.getByText("Hisob bloklangan")).toBeVisible();

      // Qayta kirish ham rad etiladi.
      await employee.page.getByLabel("Email").fill(ACCOUNTS.employee.email);
      await employee.page
        .getByLabel("Parol", { exact: true })
        .fill(ACCOUNTS.employee.password);
      await employee.page.getByRole("button", { name: "Kirish", exact: true }).click();
      await expect(employee.page.getByText("Hisob bloklangan").first()).toBeVisible();
      await expect(employee.page).toHaveURL(/\/uz\/login/);
    } finally {
      await page.getByRole("searchbox", { name: "Qidirish" }).fill("Dilshod Karimov");
      const unblock = rowFor(page, "Dilshod Karimov").getByRole("button", {
        name: /Blokdan chiqarish/,
      });
      if (await unblock.count()) await unblock.click();
      await expect(
        rowFor(page, "Dilshod Karimov").getByText("Faol", { exact: true }),
      ).toBeVisible();
      await employee.context.close();
    }
  });

  test("telefonda modal ekranga sig'adi, jadval sahifani kengaytirmaydi", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3100",
      viewport: { width: 390, height: 700 },
    });
    const page = await context.newPage();
    await openUsers(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    // Ikkinchi darajali ustunlar telefonda yashirin.
    await expect(page.getByRole("columnheader", { name: "Bo'lim" })).toBeHidden();

    await page.getByRole("button", { name: "Foydalanuvchi qo'shish" }).click();
    const dialog = page.getByRole("dialog", { name: "Yangi foydalanuvchi" });
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
    // Uzun forma modal ichida aylanadi: "Qo'shish" tugmasi ko'rinadigan joyda.
    await expect(dialog.getByRole("button", { name: "Qo'shish" })).toBeInViewport();
    await context.close();
  });
});
