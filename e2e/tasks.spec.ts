import { expect, test, type Page } from "@playwright/test";
import { loginAs, newSession } from "./helpers";

const rowFor = (page: Page, text: string) =>
  page.getByRole("row").filter({ hasText: text });

test.describe("xodim: vazifalarim", () => {
  test("faqat o'z vazifalari, yaratish tugmasi yo'q, holatni o'zgartiradi", async ({
    page,
  }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/tasks");
    await expect(
      page.getByRole("heading", { level: 1, name: "Vazifalar" }),
    ).toBeVisible();

    await expect(rowFor(page, "Oylik moliyaviy hisobotni tayyorlash")).toBeVisible();
    await expect(rowFor(page, "Hisob-fakturalarni solishtirish")).toHaveCount(0); // boshqa xodimniki
    await expect(page.getByRole("button", { name: "Yangi vazifa" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Ijrochi" })).toHaveCount(0);

    // Tekshiruvdagi ishni xodim o'zi tasdiqlay olmaydi: tugma yo'q.
    const review = rowFor(page, "Byudjet rejasini yangilash");
    await expect(review.getByText("Tekshiruvda")).toBeVisible();
    await expect(review.getByRole("button")).toHaveCount(0);
    await expect(review.getByText("Muddati o'tgan")).toBeVisible();

    const title = "Yetkazib beruvchilar shartnomalarini tekshirish";
    const row = rowFor(page, title);
    await expect(row.getByText("Kutilmoqda")).toBeVisible();
    await row.getByRole("button", { name: `Boshlash: ${title}` }).click();
    await expect(page.getByText("Holat: Jarayonda")).toBeVisible();
    await expect(rowFor(page, title).getByText("Jarayonda")).toBeVisible();
    await rowFor(page, title)
      .getByRole("button", { name: `Orqaga: ${title}` })
      .click();
    await expect(rowFor(page, title).getByText("Kutilmoqda")).toBeVisible();
  });

  test("holat bo'yicha filtr va bo'sh natija", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/tasks");
    await page.getByLabel("Holat", { exact: true }).selectOption("done");
    await expect(page.getByText("Bu holatda vazifalar yo'q")).toBeVisible();
    await page.getByLabel("Holat", { exact: true }).selectOption("all");
    await expect(rowFor(page, "Oylik moliyaviy hisobotni tayyorlash")).toBeVisible();
  });

  test("telefonda jadval sahifani kengaytirmaydi", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3100",
      viewport: { width: 390, height: 780 },
    });
    const page = await context.newPage();
    await loginAs(page, "employee");
    await page.goto("/uz/tasks");
    await expect(
      page.getByRole("heading", { level: 1, name: "Vazifalar" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("columnheader", { name: "Muddat" })).toBeHidden();
    await context.close();
  });
});

test.describe("rahbar", () => {
  test("faqat o'z jamoasini ko'radi; xodim qo'sha olmaydi", async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto("/uz/team");
    for (const name of [
      "Dilshod Karimov",
      "Nodira Yusupova",
      "Bobur Aliyev",
      "Zilola Qodirova",
    ]) {
      await expect(rowFor(page, name)).toBeVisible();
    }
    await expect(rowFor(page, "Aziz Tursunov")).toHaveCount(0); // boshqa rahbar jamoasi
    await expect(page.getByRole("button", { name: /qo'shish/i })).toHaveCount(0);

    await page.goto("/uz/tasks");
    await expect(rowFor(page, "Hisob-fakturalarni solishtirish")).toBeVisible();
    await expect(rowFor(page, "Narxlar ro'yxatini yangilash")).toHaveCount(0);

    // Yangi vazifada ijrochi faqat o'z jamoasidan.
    await page.getByRole("button", { name: "Yangi vazifa" }).click();
    const dialog = page.getByRole("dialog", { name: "Yangi vazifa" });
    const options = dialog.getByLabel(/^Ijrochi/).locator("option");
    await expect(options).toHaveCount(5); // tanlang + 4 xodim
    await expect(options.filter({ hasText: "Aziz Tursunov" })).toHaveCount(0);
  });

  test("dashboarddagi 'Tasdiq kutmoqda' soni tasdiqlash ro'yxatiga mos", async ({
    page,
  }) => {
    await loginAs(page, "manager");
    const kpi = page
      .locator("section[aria-label=KPI] > div")
      .filter({ hasText: "Tasdiq kutmoqda" })
      .locator("span")
      .nth(1);
    const count = Number(await kpi.innerText());
    await page.goto("/uz/approvals");
    await expect(
      page.getByRole("heading", { level: 1, name: "Tasdiqlash" }),
    ).toBeVisible();
    if (count === 0) {
      await expect(page.getByText("Tasdiq kutayotgan ish yo'q")).toBeVisible();
    } else {
      await expect(page.locator("tbody tr")).toHaveCount(count);
    }
  });

  test("admin barcha vazifalarni ko'radi, ijrochilar orasida admin yo'q", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/tasks");
    await expect(rowFor(page, "Narxlar ro'yxatini yangilash")).toBeVisible();
    await page.getByRole("button", { name: "Yangi vazifa" }).click();
    const options = page
      .getByRole("dialog", { name: "Yangi vazifa" })
      .getByLabel(/^Ijrochi/);
    await expect(options.locator("option", { hasText: "Gulnora Ismoilova" })).toHaveCount(
      0,
    );
    await expect(options.locator("option", { hasText: "Javlon Ergashev" })).toHaveCount(
      1,
    );
  });

  test("admin 'Mening jamoam' va 'Tasdiqlash' sahifalariga kirmaydi", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/team");
    await expect(page).toHaveURL(/\/uz\/dashboard$/);
    await page.goto("/uz/approvals");
    await expect(page).toHaveURL(/\/uz\/dashboard$/);
  });
});

test.describe("vazifa aylanishi: tayinlash -> bajarish -> tekshiruv -> qaytarish -> tasdiqlash", () => {
  test("rahbar, xodim va admin birgalikda", async ({ browser }) => {
    const stamp = Date.now();
    const title = `E2E vazifa ${stamp}`;
    const note = `Hisobotda xato ${stamp}`;
    const manager = await newSession(browser, "manager");
    const employee = await newSession(browser, "employee");
    const admin = await newSession(browser, "admin");

    try {
      // 1. Rahbar jamoa sahifasidan Dilshodga vazifa tayinlaydi.
      await manager.page.goto("/uz/team");
      await rowFor(manager.page, "Dilshod Karimov")
        .getByRole("button", { name: "Vazifa tayinlash: Dilshod Karimov" })
        .click();
      const form = manager.page.getByRole("dialog", { name: "Yangi vazifa" });
      await expect(form.getByLabel(/^Ijrochi/)).toHaveValue("u_employee");
      await form.getByRole("button", { name: "Yaratish" }).click();
      await expect(form.getByText("Sarlavhani kiriting (kamida 3 belgi)")).toBeVisible();
      await form.getByLabel(/^Sarlavha/).fill(title);
      await form.getByRole("button", { name: "Yaratish" }).click();
      await expect(manager.page.getByText("Vazifa yaratildi")).toBeVisible();
      await expect(form).toBeHidden();

      // 2. Xodim boshlaydi va tekshiruvga yuboradi.
      await employee.page.goto("/uz/tasks");
      let row = rowFor(employee.page, title);
      await expect(row.getByText("Kutilmoqda")).toBeVisible();
      await row.getByRole("button", { name: `Boshlash: ${title}` }).click();
      await expect(rowFor(employee.page, title).getByText("Jarayonda")).toBeVisible();
      await rowFor(employee.page, title)
        .getByRole("button", { name: `Tekshiruvga yuborish: ${title}` })
        .click();
      await expect(rowFor(employee.page, title).getByText("Tekshiruvda")).toBeVisible();

      // 3. Rahbar sababsiz qaytara olmaydi; sabab bilan qaytaradi.
      await manager.page.goto("/uz/approvals");
      await rowFor(manager.page, title)
        .getByRole("button", { name: `Qaytarish: ${title}` })
        .click();
      const ret = manager.page.getByRole("dialog", { name: "Vazifani qaytarish" });
      await ret.getByRole("button", { name: "Qaytarish" }).click();
      await expect(ret.getByText("Sababni yozing (kamida 3 belgi)")).toBeVisible();
      await ret.getByLabel(/^Qaytarish sababi/).fill(note);
      await ret.getByRole("button", { name: "Qaytarish" }).click();
      await expect(manager.page.getByText("Vazifa qaytarildi")).toBeVisible();
      await expect(rowFor(manager.page, title)).toHaveCount(0);

      // 4. Xodim sababni ko'radi va qayta yuboradi.
      await employee.page.reload();
      row = rowFor(employee.page, title);
      await expect(row.getByText(`Qaytarildi: ${note}`)).toBeVisible();
      await expect(row.getByText("Jarayonda")).toBeVisible();
      await row.getByRole("button", { name: `Tekshiruvga yuborish: ${title}` }).click();
      await expect(rowFor(employee.page, title).getByText("Tekshiruvda")).toBeVisible();

      // 5. Rahbar tasdiqlaydi.
      await manager.page.reload();
      await rowFor(manager.page, title)
        .getByRole("button", { name: `Tasdiqlash: ${title}` })
        .click();
      await expect(manager.page.getByText("Holat: Bajarildi")).toBeVisible();
      await expect(rowFor(manager.page, title)).toHaveCount(0);

      // 6. Admin natijani ko'radi va tozalaydi.
      await admin.page.goto("/uz/tasks");
      await admin.page.getByRole("searchbox", { name: "Qidirish" }).fill(String(stamp));
      await expect(rowFor(admin.page, title).getByText("Bajarildi")).toBeVisible();
      await rowFor(admin.page, title)
        .getByRole("button", { name: `O'chirish: ${title}` })
        .click();
      await admin.page
        .getByRole("dialog", { name: "Vazifani o'chiramizmi?" })
        .getByRole("button", { name: "O'chirish" })
        .click();
      await expect(admin.page.getByText("Vazifa o'chirildi")).toBeVisible();
      await expect(rowFor(admin.page, title)).toHaveCount(0);
    } finally {
      await Promise.all([
        manager.context.close(),
        employee.context.close(),
        admin.context.close(),
      ]);
    }
  });

  test("tahrirlash: rahbar sarlavha va muddatni o'zgartiradi", async ({ page }) => {
    const stamp = Date.now();
    const title = `Tahrir ${stamp}`;
    await loginAs(page, "manager");
    await page.goto("/uz/tasks");
    await page.getByRole("button", { name: "Yangi vazifa" }).click();
    const form = page.getByRole("dialog", { name: "Yangi vazifa" });
    await form.getByLabel(/^Sarlavha/).fill(title);
    await form.getByLabel(/^Ijrochi/).selectOption({ label: "Bobur Aliyev" });
    await form.getByLabel(/^Muhimlik/).selectOption("high");
    await form.getByLabel(/^Muddat/).fill("2030-05-20");
    await form.getByRole("button", { name: "Yaratish" }).click();
    await expect(page.getByText("Vazifa yaratildi")).toBeVisible();

    await page.getByRole("searchbox", { name: "Qidirish" }).fill(String(stamp));
    await rowFor(page, title)
      .getByRole("button", { name: `Tahrirlash: ${title}` })
      .click();
    const edit = page.getByRole("dialog", { name: "Vazifani tahrirlash" });
    await expect(edit.getByLabel(/^Sarlavha/)).toHaveValue(title);
    await edit.getByLabel(/^Sarlavha/).fill(`${title} (yangi)`);
    await edit.getByLabel(/^Muddat/).fill("2030-06-01");
    await edit.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Vazifa yangilandi")).toBeVisible();
    await expect(rowFor(page, `${title} (yangi)`)).toBeVisible();

    await rowFor(page, `${title} (yangi)`)
      .getByRole("button", { name: /^O'chirish:/ })
      .click();
    await page
      .getByRole("dialog", { name: "Vazifani o'chiramizmi?" })
      .getByRole("button", { name: "O'chirish" })
      .click();
    await expect(page.getByText("Vazifa o'chirildi")).toBeVisible();
  });
});
