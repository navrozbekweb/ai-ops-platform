import { expect, test } from "@playwright/test";
import { BASE_URL, apiAnonymous, apiAs } from "./helpers";

const task = (assigneeId: string, title = "API test vazifasi") => ({
  title,
  description: "",
  assigneeId,
  priority: "medium",
  due: "2030-01-15",
});

test.describe("API: sessiya va ruxsatlar", () => {
  test("sessiyasiz so'rovlar 401 qaytaradi", async ({ playwright }) => {
    const anon = await apiAnonymous(playwright);
    expect((await anon.get("/api/users")).status()).toBe(401);
    expect((await anon.get("/api/tasks")).status()).toBe(401);
    expect((await anon.post("/api/tasks", { data: task("u_e1") })).status()).toBe(401);
    expect((await anon.delete("/api/tasks/t_1")).status()).toBe(401);
  });

  test("boshqa saytdan kelgan yozuvchi so'rov rad etiladi (CSRF)", async ({
    playwright,
  }) => {
    const admin = await apiAs(playwright, "admin");
    const response = await admin.post("/api/tasks", {
      headers: { Origin: "https://evil.example" },
      data: task("u_e1"),
    });
    expect(response.status()).toBe(403);
  });

  test("xodim foydalanuvchilarni ko'ra olmaydi va yarata olmaydi", async ({
    playwright,
  }) => {
    const employee = await apiAs(playwright, "employee");
    expect((await employee.get("/api/users")).status()).toBe(403);
    const created = await employee.post("/api/users", {
      data: { name: "Hacker", email: "hacker@aiops.uz", role: "admin", dept: "IT" },
    });
    expect(created.status()).toBe(403);
  });

  test("rahbar xodim qo'sha olmaydi va foydalanuvchini o'zgartira olmaydi", async ({
    playwright,
  }) => {
    const manager = await apiAs(playwright, "manager");
    const created = await manager.post("/api/users", {
      data: {
        name: "Yangi Xodim",
        email: "yangi.xodim@aiops.uz",
        role: "employee",
        dept: "Moliya",
      },
    });
    expect(created.status()).toBe(403);
    expect(
      (await manager.patch("/api/users/u_e1", { data: { role: "admin" } })).status(),
    ).toBe(403);
    expect((await manager.delete("/api/users/u_e1")).status()).toBe(403);
  });

  test("admin o'zini bloklay, pastlata va o'chira olmaydi", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const block = await admin.patch("/api/users/u_admin", { data: { active: false } });
    expect(block.status()).toBe(409);
    expect((await block.json()).error).toBe("selfAction");
    expect(
      (await admin.patch("/api/users/u_admin", { data: { role: "employee" } })).status(),
    ).toBe(409);
    expect((await admin.delete("/api/users/u_admin")).status()).toBe(409);
  });

  test("foydalanuvchi yaratishda email takrorlanmaydi va ma'lumot tekshiriladi", async ({
    playwright,
  }) => {
    const admin = await apiAs(playwright, "admin");
    const duplicate = await admin.post("/api/users", {
      data: { name: "Nusxa", email: "ADMIN@aiops.uz", role: "employee", dept: "IT" },
    });
    expect(duplicate.status()).toBe(409);
    expect((await duplicate.json()).error).toBe("emailTaken");

    const invalid = await admin.post("/api/users", {
      data: { name: "X", email: "not-an-email", role: "superuser", dept: "" },
    });
    expect(invalid.status()).toBe(400);
  });
});

test.describe("API: vazifalar", () => {
  test("xodim vazifa yarata olmaydi va faqat o'zinikini ko'radi", async ({
    playwright,
  }) => {
    const employee = await apiAs(playwright, "employee");
    expect(
      (await employee.post("/api/tasks", { data: task("u_employee") })).status(),
    ).toBe(403);

    const list = await employee.get("/api/tasks");
    expect(list.status()).toBe(200);
    const { tasks } = (await list.json()) as { tasks: { assigneeId: string }[] };
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.assigneeId === "u_employee")).toBe(true);

    // Boshqa xodimning vazifasi mavjudligi ham oshkor bo'lmaydi.
    expect(
      (
        await employee.patch("/api/tasks/t_4", { data: { status: "in_progress" } })
      ).status(),
    ).toBe(404);
    expect((await employee.delete("/api/tasks/t_4")).status()).toBe(404);
  });

  test("xodim o'z ishini o'zi tasdiqlay olmaydi", async ({ playwright }) => {
    const employee = await apiAs(playwright, "employee");
    // t_3 tekshiruvda, ijrochi u_employee.
    const approve = await employee.patch("/api/tasks/t_3", { data: { status: "done" } });
    expect(approve.status()).toBe(403);
    // Mavjud bo'lmagan o'tish: kutilmoqda -> tekshiruvda.
    const skip = await employee.patch("/api/tasks/t_2", { data: { status: "review" } });
    expect(skip.status()).toBe(409);
    // Maydonlarni tahrirlash faqat rahbar/admin uchun.
    const edit = await employee.patch("/api/tasks/t_2", {
      data: { title: "Boshqa nom" },
    });
    expect(edit.status()).toBe(403);
  });

  test("rahbar faqat o'z jamoasiga vazifa tayinlaydi", async ({ playwright }) => {
    const manager = await apiAs(playwright, "manager");
    const own = await manager.post("/api/tasks", {
      data: task("u_e1", "Jamoa vazifasi"),
    });
    expect(own.status()).toBe(200);
    const created = (await own.json()).task as { id: string };

    for (const outsider of ["u_e4", "u_admin", "u_manager2", "no-such-user"]) {
      const response = await manager.post("/api/tasks", { data: task(outsider) });
      expect(response.status(), outsider).toBe(400);
      expect((await response.json()).error).toBe("invalidAssignee");
    }
    // Tayinlangan vazifani boshqa jamoaga o'tkazib ham bo'lmaydi.
    const move = await manager.patch(`/api/tasks/${created.id}`, {
      data: { assigneeId: "u_e4" },
    });
    expect(move.status()).toBe(400);
    expect((await manager.delete(`/api/tasks/${created.id}`)).status()).toBe(200);
  });

  test("rahbar boshqa jamoa vazifasini ko'rmaydi va o'zgartira olmaydi", async ({
    playwright,
  }) => {
    const manager = await apiAs(playwright, "manager");
    const { tasks } = (await (await manager.get("/api/tasks")).json()) as {
      tasks: { id: string }[];
    };
    expect(tasks.some((t) => t.id === "t_9")).toBe(false); // u_manager2 jamoasi
    expect(
      (await manager.patch("/api/tasks/t_9", { data: { title: "Hack" } })).status(),
    ).toBe(404);
    expect((await manager.delete("/api/tasks/t_9")).status()).toBe(404);
  });

  test("admin barcha vazifalarni ko'radi", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const { tasks } = (await (await admin.get("/api/tasks")).json()) as {
      tasks: { id: string }[];
    };
    expect(tasks.some((t) => t.id === "t_9")).toBe(true);
    expect(tasks.some((t) => t.id === "t_1")).toBe(true);
  });

  test("tekshiruvdan qaytarishda sabab majburiy", async ({ playwright }) => {
    const manager = await apiAs(playwright, "manager");
    const employee = await apiAs(playwright, "employee");

    const created = (
      await (
        await manager.post("/api/tasks", { data: task("u_employee", "Qaytarish testi") })
      ).json()
    ).task as { id: string };
    expect(
      (
        await employee.patch(`/api/tasks/${created.id}`, {
          data: { status: "in_progress" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await employee.patch(`/api/tasks/${created.id}`, { data: { status: "review" } })
      ).status(),
    ).toBe(200);

    const noNote = await manager.patch(`/api/tasks/${created.id}`, {
      data: { status: "in_progress" },
    });
    expect(noNote.status()).toBe(400);
    expect((await noNote.json()).error).toBe("noteRequired");

    const withNote = await manager.patch(`/api/tasks/${created.id}`, {
      data: { status: "in_progress", note: "Raqamlar mos kelmadi" },
    });
    expect(withNote.status()).toBe(200);
    expect((await withNote.json()).task.note).toBe("Raqamlar mos kelmadi");

    await manager.delete(`/api/tasks/${created.id}`);
  });

  test("noto'g'ri tana 400 qaytaradi, juda katta tana 413", async ({ playwright }) => {
    const manager = await apiAs(playwright, "manager");
    expect((await manager.post("/api/tasks", { data: { title: "a" } })).status()).toBe(
      400,
    );
    expect(
      (
        await manager.post("/api/tasks", { data: { ...task("u_e1"), due: "2030-13-45" } })
      ).status(),
    ).toBe(400);
    const huge = await manager.post("/api/tasks", {
      data: { ...task("u_e1"), description: "x".repeat(9000) },
    });
    expect(huge.status()).toBe(413);
  });
});

test("API javoblari keshlanmaydi", async ({ playwright }) => {
  const admin = await apiAs(playwright, "admin");
  const response = await admin.get("/api/tasks");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(BASE_URL).toContain("3100");
});
