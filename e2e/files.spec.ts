import { expect, test } from "@playwright/test";
import { apiAnonymous, apiAs, newSession } from "./helpers";

/**
 * Hafta 7: hujjatga fayl biriktirish va yuklab olish.
 * Server holati testlar orasida umumiy, shuning uchun yaratilgan hujjatlar oxirida o'chiriladi.
 */
const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

function fields(title: string, shared = "false") {
  return { title, category: "report", description: "fayl sinovi", shared };
}

test.describe("hujjat fayllari", () => {
  test("fayl yuklanadi va aynan o'sha baytlar bilan yuklab olinadi", async ({
    playwright,
  }) => {
    const employee = await apiAs(playwright, "employee");
    const created = await employee.post("/api/docs", {
      multipart: {
        ...fields("Fayl sinovi 1"),
        file: { name: "hisobot.pdf", mimeType: "application/pdf", buffer: PDF },
      },
    });
    expect(created.status()).toBe(200);
    const { doc } = await created.json();
    expect(doc.file).toMatchObject({ name: "hisobot.pdf", size: PDF.length });

    const download = await employee.get(`/api/docs/${doc.id}/file`);
    expect(download.status()).toBe(200);
    expect(Buffer.from(await download.body()).equals(PDF)).toBe(true);
    const headers = download.headers();
    expect(headers["content-type"]).toBe("application/pdf");
    expect(headers["content-disposition"]).toContain("attachment");
    expect(headers["content-disposition"]).toContain("hisobot.pdf");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["cache-control"]).toContain("no-store");

    await employee.delete(`/api/docs/${doc.id}`);
    expect((await employee.get(`/api/docs/${doc.id}/file`)).status()).toBe(404);
  });

  test("fayl ko'rinish huquqiga bo'ysunadi (begona shaxsiy faylga 404)", async ({
    playwright,
  }) => {
    const employee = await apiAs(playwright, "employee");
    const created = await employee.post("/api/docs", {
      multipart: {
        ...fields("Shaxsiy fayl"),
        file: { name: "maxfiy.pdf", mimeType: "application/pdf", buffer: PDF },
      },
    });
    const { doc } = await created.json();

    // Rahbar (dastlabki xodimning rahbari) va admin ko'radi.
    expect(
      (await (await apiAs(playwright, "admin")).get(`/api/docs/${doc.id}/file`)).status(),
    ).toBe(200);
    expect(
      (
        await (await apiAs(playwright, "manager")).get(`/api/docs/${doc.id}/file`)
      ).status(),
    ).toBe(200);
    // Kirmagan foydalanuvchi.
    const anon = await apiAnonymous(playwright);
    expect((await anon.get(`/api/docs/${doc.id}/file`)).status()).toBe(401);
    // Faylsiz seed hujjat uchun 404.
    expect((await employee.get("/api/docs/d_1/file")).status()).toBe(404);

    await employee.delete(`/api/docs/${doc.id}`);

    // Rahbarning shaxsiy fayli: oddiy xodim uni ko'rmaydi (404), umumiy qilinsa ko'radi.
    const manager = await apiAs(playwright, "manager");
    const own = await manager.post("/api/docs", {
      multipart: {
        ...fields("Rahbar fayli"),
        file: { name: "reja.pdf", mimeType: "application/pdf", buffer: PDF },
      },
    });
    const { doc: managerDoc } = await own.json();
    expect((await employee.get(`/api/docs/${managerDoc.id}/file`)).status()).toBe(404);
    await manager.delete(`/api/docs/${managerDoc.id}`);

    const shared = await manager.post("/api/docs", {
      multipart: {
        ...fields("Umumiy rahbar fayli", "true"),
        file: { name: "reja.pdf", mimeType: "application/pdf", buffer: PDF },
      },
    });
    const { doc: sharedDoc } = await shared.json();
    expect((await employee.get(`/api/docs/${sharedDoc.id}/file`)).status()).toBe(200);
    await manager.delete(`/api/docs/${sharedDoc.id}`);
  });

  test("server noto'g'ri turdagi, katta va soxta fayllarni rad etadi", async ({
    playwright,
  }) => {
    const employee = await apiAs(playwright, "employee");
    const post = (name: string, buffer: Buffer, mimeType = "application/pdf") =>
      employee.post("/api/docs", {
        multipart: { ...fields("Rad etiladigan"), file: { name, mimeType, buffer } },
      });

    // Ruxsat etilmagan kengaytma (mijoz turi PDF desa ham).
    expect((await post("zararli.html", Buffer.from("<script>1</script>"))).status()).toBe(
      415,
    );
    expect((await post("zararli.exe", Buffer.from("MZ"))).status()).toBe(415);
    // Kengaytma PDF, ichi esa boshqa narsa.
    expect((await post("soxta.pdf", Buffer.from("bu pdf emas"))).status()).toBe(415);
    // Chegaradan katta.
    const big = Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024)]);
    expect((await post("katta.pdf", big)).status()).toBe(413);

    const list = await (await employee.get("/api/docs")).json();
    expect(list.docs.some((d: { title: string }) => d.title === "Rad etiladigan")).toBe(
      false,
    );
  });

  test("fayl nomi yo'l belgilaridan tozalanadi", async ({ playwright }) => {
    const employee = await apiAs(playwright, "employee");
    const created = await employee.post("/api/docs", {
      multipart: {
        ...fields("Nom sinovi"),
        file: {
          name: '../../etc/h"isobot.pdf',
          mimeType: "application/pdf",
          buffer: PDF,
        },
      },
    });
    expect(created.status()).toBe(200);
    const { doc } = await created.json();
    expect(doc.file.name).toBe("hisobot.pdf");
    await employee.delete(`/api/docs/${doc.id}`);
  });

  test("faylsiz JSON so'rov avvalgidek ishlaydi", async ({ playwright }) => {
    const employee = await apiAs(playwright, "employee");
    const created = await employee.post("/api/docs", {
      data: {
        title: "Faylsiz hujjat",
        category: "other",
        description: "",
        shared: false,
      },
    });
    expect(created.status()).toBe(200);
    const { doc } = await created.json();
    expect(doc.file).toBeUndefined();
    await employee.delete(`/api/docs/${doc.id}`);
  });

  test("interfeys: fayl tanlab hujjat qo'shiladi, jadvalda yuklab olinadi, noto'g'ri tur rad etiladi", async ({
    browser,
  }) => {
    const { page, context } = await newSession(browser, "employee");
    await page.goto("/uz/documents");
    await page.getByRole("button", { name: "Hujjat qo'shish" }).first().click();
    const dialog = page.getByRole("dialog");

    // Noto'g'ri tur brauzerning o'zida rad etiladi.
    await dialog.getByLabel(/^Fayl/).setInputFiles({
      name: "dastur.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("MZ"),
    });
    await expect(dialog.getByText("Bu fayl turi qabul qilinmaydi")).toBeVisible();

    await dialog.getByLabel(/^Sarlavha/).fill("UI fayl sinovi");
    await dialog.getByLabel(/^Fayl/).setInputFiles({
      name: "shartnoma.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    });
    await expect(dialog.getByText("Bu fayl turi qabul qilinmaydi")).toBeHidden();
    await dialog.getByRole("button", { name: "Qo'shish" }).click();
    await expect(page.getByText("Hujjat qo'shildi")).toBeVisible();

    await expect(page.getByText("Fayl: shartnoma.pdf")).toBeVisible();
    const link = page.getByRole("link", { name: "Faylni yuklab olish: UI fayl sinovi" });
    const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
    expect(download.suggestedFilename()).toBe("shartnoma.pdf");

    // Tozalash.
    await page.getByRole("button", { name: "O'chirish: UI fayl sinovi" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "O'chirish", exact: true })
      .click();
    await expect(page.getByText("Hujjat o'chirildi")).toBeVisible();
    await context.close();
  });
});
