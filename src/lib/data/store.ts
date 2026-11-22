import "server-only";
import type { Person, Task } from "./types";
import type { Priority, TaskStatus } from "@/lib/schemas/directory";

/**
 * MOCK ma'lumotlar ombori (xotirada). Next.js route handler va server komponentlarni
 * alohida bundle qilishi mumkin, shuning uchun holat `globalThis` da saqlanadi:
 * ikkala tomon bitta nusxani ko'radi. Server qayta ishga tushsa, boshlang'ich holatga qaytadi.
 * Haqiqiy backend ulanganda shu faylning funksiyalari API chaqiruvlariga almashtiriladi.
 */
type Db = { people: Person[]; tasks: Task[]; seq: number };

const KEY = Symbol.for("aiops.mock.db");
type Holder = { [KEY]?: Db };

function isoDay(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function person(
  id: string,
  name: string,
  role: Person["role"],
  dept: string,
  managerId: string | null = null,
  active = true,
): Person {
  const email = `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .join(".")}@aiops.uz`;
  return { id, name, email, role, dept, managerId, active };
}

function seed(): Db {
  const people: Person[] = [
    // Demo hisoblar (email/parol lib/mock/users.ts da)
    {
      id: "u_admin",
      name: "Sanjar Rasulov",
      email: "admin@aiops.uz",
      role: "admin",
      dept: "Boshqaruv",
      managerId: null,
      active: true,
    },
    {
      id: "u_manager",
      name: "Malika Rahimova",
      email: "manager@aiops.uz",
      role: "manager",
      dept: "Moliya",
      managerId: null,
      active: true,
    },
    {
      id: "u_employee",
      name: "Dilshod Karimov",
      email: "employee@aiops.uz",
      role: "employee",
      dept: "Moliya",
      managerId: "u_manager",
      active: true,
    },
    person("u_admin2", "Gulnora Ismoilova", "admin", "Boshqaruv"),
    person("u_manager2", "Javlon Ergashev", "manager", "Savdo"),
    person("u_e1", "Nodira Yusupova", "employee", "Moliya", "u_manager"),
    person("u_e2", "Bobur Aliyev", "employee", "Moliya", "u_manager"),
    person("u_e3", "Zilola Qodirova", "employee", "Moliya", "u_manager"),
    person("u_e4", "Aziz Tursunov", "employee", "Savdo", "u_manager2"),
    person("u_e5", "Madina Sodiqova", "employee", "Savdo", "u_manager2"),
    person("u_e6", "Sherzod Nazarov", "employee", "Savdo", "u_manager2"),
    person("u_e7", "Kamola Hasanova", "employee", "Marketing"),
    person("u_e8", "Rustam Ortiqov", "employee", "IT", null, false),
  ];

  const now = new Date().toISOString();
  const t = (
    n: number,
    title: string,
    description: string,
    assigneeId: string,
    creatorId: string,
    status: TaskStatus,
    priority: Priority,
    due: number,
    note: string | null = null,
  ): Task => ({
    id: `t_${n}`,
    title,
    description,
    assigneeId,
    creatorId,
    status,
    priority,
    due: isoDay(due),
    note,
    updatedAt: now,
  });

  const tasks: Task[] = [
    t(
      1,
      "Oylik moliyaviy hisobotni tayyorlash",
      "Oktyabr oyi daromad va xarajatlar jadvali.",
      "u_employee",
      "u_manager",
      "in_progress",
      "high",
      3,
    ),
    t(
      2,
      "Yetkazib beruvchilar shartnomalarini tekshirish",
      "Muddati tugayotgan 4 ta shartnoma.",
      "u_employee",
      "u_manager",
      "todo",
      "medium",
      7,
    ),
    t(
      3,
      "Byudjet rejasini yangilash",
      "",
      "u_employee",
      "u_manager",
      "review",
      "high",
      -1,
    ),
    t(
      4,
      "Hisob-fakturalarni solishtirish",
      "Bank ko'chirmasi bilan.",
      "u_e1",
      "u_manager",
      "todo",
      "medium",
      5,
    ),
    t(5, "Soliq deklaratsiyasi qoralamasi", "", "u_e1", "u_manager", "review", "high", 1),
    t(
      6,
      "Xarajatlar kategoriyalarini tartiblash",
      "",
      "u_e2",
      "u_manager",
      "done",
      "low",
      -4,
    ),
    t(
      7,
      "Debitorlik qarzlari ro'yxati",
      "Muddati o'tganlar birinchi.",
      "u_e2",
      "u_manager",
      "in_progress",
      "high",
      -2,
    ),
    t(8, "Kassa hisobotini yopish", "", "u_e3", "u_manager", "todo", "low", 9),
    t(
      9,
      "Yangi mijozlar bazasini yuritish",
      "CRM'ga 30 ta yozuv.",
      "u_e4",
      "u_manager2",
      "in_progress",
      "medium",
      4,
    ),
    t(10, "Savdo prognozi (Q1)", "", "u_e5", "u_manager2", "review", "high", 2),
    t(11, "Narxlar ro'yxatini yangilash", "", "u_e6", "u_manager2", "todo", "medium", 6),
    t(12, "Veb-sayt matnlarini tekshirish", "", "u_e7", "u_admin", "todo", "low", 12),
    t(
      13,
      "Xodimlar ma'lumotnomasini yangilash",
      "",
      "u_manager",
      "u_admin",
      "in_progress",
      "medium",
      5,
    ),
  ];

  return { people, tasks, seq: 100 };
}

export function db(): Db {
  const holder = globalThis as typeof globalThis & Holder;
  holder[KEY] ??= seed();
  return holder[KEY];
}

export function nextId(prefix: string): string {
  const database = db();
  database.seq += 1;
  return `${prefix}_${database.seq}`;
}
