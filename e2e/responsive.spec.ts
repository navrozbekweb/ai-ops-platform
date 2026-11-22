import { expect, test } from "@playwright/test";
import { navItemsFor, type Role } from "../src/lib/auth/roles";
import { loginAs } from "./helpers";

const VIEWPORTS = [
  { name: "telefon", width: 390, height: 844 },
  { name: "planshet", width: 768, height: 1024 },
  { name: "kompyuter", width: 1440, height: 900 },
] as const;
const ROLES: Role[] = ["admin", "manager", "employee"];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width} px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const role of ROLES) {
      test(`${role}: hech bir sahifa gorizontal scroll bermaydi`, async ({ page }) => {
        await loginAs(page, role);
        for (const section of [...new Set([...navItemsFor(role), "profile"])]) {
          await page.goto(`/uz/${section}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          const overflow = await page.evaluate(
            () =>
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, `${role}/${section} @${viewport.width}`).toBeLessThanOrEqual(
            0,
          );
        }
      });
    }

    test("menyu: kompyuterda doimiy yon panel, boshqa kengliklarda tugma", async ({
      page,
    }) => {
      await loginAs(page, "manager");
      const aside = page.getByRole("complementary");
      const menuButton = page.getByRole("button", { name: "Menyu", exact: true });
      if (viewport.width >= 1024) {
        await expect(aside).toBeVisible();
        await expect(menuButton).toBeHidden();
      } else {
        await expect(aside).toBeHidden();
        await expect(menuButton).toBeVisible();
      }
    });

    test("sarlavha elementlari ekran ichida va bosish maydoni yetarli", async ({
      page,
    }) => {
      await loginAs(page, "admin");
      const controls = page
        .getByRole("banner")
        .getByRole("button")
        .filter({ visible: true });
      const count = await controls.count();
      expect(count).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < count; i += 1) {
        const box = (await controls.nth(i).boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });
}

test.describe("telefon: amal tugmalari jadvalni surmasdan ko'rinadi", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("xodim vazifa amalini telefonda bajara oladi", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/uz/tasks");
    const action = page
      .getByRole("table")
      .getByRole("button", { name: /Boshlash|Tekshiruvga yuborish|Orqaga/ })
      .first();
    await expect(action).toBeVisible();
    const box = (await action.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });

  test("admin foydalanuvchi amallarini telefonda ko'radi", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/uz/users");
    const edit = page
      .getByRole("table")
      .getByRole("button", { name: /^Tahrirlash:/ })
      .first();
    await expect(edit).toBeVisible();
    const box = (await edit.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});

test.describe("modal oyna turli kengliklarda", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: forma modali ekranga sig'adi`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loginAs(page, "admin");
      await page.goto("/uz/users");
      await page.getByRole("button", { name: "Foydalanuvchi qo'shish" }).click();
      const dialog = page.getByRole("dialog", { name: "Yangi foydalanuvchi" });
      await expect(dialog).toBeVisible();
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    });
  }
});
