import "server-only";
import type { Role } from "@/lib/auth/roles";
import type {
  TaskCreateInput,
  TaskStatus,
  UserCreateOutput,
  UserUpdateInput,
} from "@/lib/schemas/directory";
import { db, logAudit, nextId } from "./store";
import type { Person, Task, TaskView } from "./types";

/**
 * Biznes qoidalari va ruxsatlar. Hamma tekshiruv shu yerda (serverda): UI faqat qulaylik uchun
 * tugmalarni yashiradi, lekin haqiqiy himoya shu funksiyalar. Rol har doim ombordan olinadi,
 * JWT ichidagi nusxadan emas: rol o'zgarsa yoki hisob bloklansa, darhol kuchga kiradi.
 */
export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "emailTaken"
  | "selfAction"
  | "lastAdmin"
  | "hasOpenTasks"
  | "invalidAssignee"
  | "invalidManager"
  | "invalidTransition"
  | "noteRequired"
  | "validation"
  | "wrongPassword"
  | "aiDisabled"
  | "aiUnavailable"
  | "fileTooLarge"
  | "fileType"
  | "storageFull"
  | "empty";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  emailTaken: 409,
  selfAction: 409,
  lastAdmin: 409,
  hasOpenTasks: 409,
  invalidAssignee: 400,
  invalidManager: 400,
  invalidTransition: 409,
  noteRequired: 400,
  validation: 400,
  wrongPassword: 400,
  aiDisabled: 409,
  aiUnavailable: 502,
  fileTooLarge: 413,
  fileType: 415,
  storageFull: 507,
  empty: 400,
};

export type Result<T> =
  { ok: true; value: T } | { ok: false; error: ApiErrorCode; status: number };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (error: ApiErrorCode): Result<never> => ({
  ok: false,
  error,
  status: STATUS_BY_CODE[error],
});

export function findActor(id: string | undefined): Person | null {
  if (!id) return null;
  const found = db().people.find((p) => p.id === id);
  return found && found.active ? found : null;
}

const byId = (id: string) => db().people.find((p) => p.id === id);

// ---------------------------------------------------------------- foydalanuvchilar

export function listPeople(actor: Person): Result<Person[]> {
  if (actor.role !== "admin") return fail("forbidden");
  return ok([...db().people].sort((a, b) => a.name.localeCompare(b.name)));
}

export function managersList(): Person[] {
  return db().people.filter((p) => p.role === "manager" && p.active);
}

function activeAdmins(): Person[] {
  return db().people.filter((p) => p.role === "admin" && p.active);
}

export function createUser(actor: Person, input: UserCreateOutput): Result<Person> {
  if (actor.role !== "admin") return fail("forbidden");
  if (db().people.some((p) => p.email === input.email)) return fail("emailTaken");

  let managerId: string | null = null;
  if (input.role === "employee" && input.managerId) {
    const manager = byId(input.managerId);
    if (!manager || manager.role !== "manager" || !manager.active)
      return fail("invalidManager");
    managerId = manager.id;
  }

  const created: Person = {
    id: nextId("u"),
    name: input.name,
    email: input.email,
    role: input.role,
    dept: input.dept,
    managerId,
    active: true,
  };
  db().people.push(created);
  logAudit(actor, "user_create", created.name);
  return ok(created);
}

export function updateUser(
  actor: Person,
  id: string,
  patch: UserUpdateInput,
): Result<Person> {
  if (actor.role !== "admin") return fail("forbidden");
  const target = byId(id);
  if (!target) return fail("notFound");
  if (Object.keys(patch).length === 0) return fail("empty");

  const nextRole = patch.role ?? target.role;
  const nextActive = patch.active ?? target.active;

  if (target.id === actor.id && (nextRole !== target.role || !nextActive))
    return fail("selfAction");

  // Himoya qatlami: amaldagi qoidalarda yagona faol adminni faqat o'zi o'zgartira oladi va bu
  // `selfAction` bilan to'xtatiladi. Haqiqiy backendda boshqa aktorlar paydo bo'lsa, bu qoida ishlaydi.
  const losesAdmin = target.role === "admin" && target.active;
  const keepsAdmin = nextRole === "admin" && nextActive;
  if (losesAdmin && !keepsAdmin && activeAdmins().length <= 1) return fail("lastAdmin");

  let managerId = patch.managerId !== undefined ? patch.managerId : target.managerId;
  if (nextRole !== "employee") managerId = null;
  if (managerId) {
    const manager = byId(managerId);
    if (!manager || manager.role !== "manager" || !manager.active)
      return fail("invalidManager");
  }

  // Rahbar boshqa rolga o'tsa, uning jamoasi rahbarsiz qoladi.
  if (target.role === "manager" && nextRole !== "manager") {
    for (const p of db().people) if (p.managerId === target.id) p.managerId = null;
  }

  Object.assign(target, {
    name: patch.name ?? target.name,
    dept: patch.dept ?? target.dept,
    role: nextRole,
    active: nextActive,
    managerId,
  });
  logAudit(actor, "user_update", target.name);
  return ok(target);
}

export function deleteUser(actor: Person, id: string): Result<null> {
  if (actor.role !== "admin") return fail("forbidden");
  const target = byId(id);
  if (!target) return fail("notFound");
  if (target.id === actor.id) return fail("selfAction");
  if (target.role === "admin" && target.active && activeAdmins().length <= 1)
    return fail("lastAdmin");
  if (db().tasks.some((t) => t.assigneeId === id && t.status !== "done"))
    return fail("hasOpenTasks");

  const database = db();
  database.tasks = database.tasks.filter((t) => t.assigneeId !== id);
  for (const p of database.people) if (p.managerId === id) p.managerId = null;
  database.people = database.people.filter((p) => p.id !== id);
  logAudit(actor, "user_delete", target.name);
  return ok(null);
}

// ---------------------------------------------------------------- jamoa va vazifalar

export function teamOf(actor: Person): Person[] {
  return db().people.filter((p) => p.managerId === actor.id && p.active);
}

/** Vazifani ko'ra oladimi. */
function canSee(actor: Person, task: Task): boolean {
  if (actor.role === "admin") return true;
  if (task.assigneeId === actor.id) return true;
  if (actor.role === "manager") {
    return task.creatorId === actor.id || byId(task.assigneeId)?.managerId === actor.id;
  }
  return false;
}

/** Vazifani boshqara oladimi (tahrirlash, o'chirish, tasdiqlash). */
function canManage(actor: Person, task: Task): boolean {
  if (task.assigneeId === actor.id) return false; // o'zining vazifasini o'zi tasdiqlamaydi
  if (actor.role === "admin") return true;
  if (actor.role === "manager") return canSee(actor, task);
  return false;
}

const EMPLOYEE_MOVES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  todo: ["in_progress"],
  in_progress: ["todo", "review"],
};
const REVIEWER_MOVES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  review: ["done", "in_progress"],
};

function allowedMoves(actor: Person, task: Task): TaskStatus[] {
  if (task.assigneeId === actor.id) return EMPLOYEE_MOVES[task.status] ?? [];
  if (canManage(actor, task)) return REVIEWER_MOVES[task.status] ?? [];
  return [];
}

function view(actor: Person, task: Task): TaskView {
  return {
    ...task,
    assigneeName: byId(task.assigneeId)?.name ?? "-",
    creatorName: byId(task.creatorId)?.name ?? "-",
    can: { manage: canManage(actor, task), advance: allowedMoves(actor, task) },
  };
}

export function listTasks(actor: Person): TaskView[] {
  return db()
    .tasks.filter((t) => canSee(actor, t))
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((t) => view(actor, t));
}

/** Vazifa tayinlash mumkin bo'lgan odamlar. */
export function assignablePeople(actor: Person): Person[] {
  if (actor.role === "admin")
    return db().people.filter((p) => p.active && p.role !== "admin");
  if (actor.role === "manager") return teamOf(actor);
  return [];
}

export function createTask(actor: Person, input: TaskCreateInput): Result<TaskView> {
  if (actor.role === "employee") return fail("forbidden");
  const assignee = assignablePeople(actor).find((p) => p.id === input.assigneeId);
  if (!assignee) return fail("invalidAssignee");

  const task: Task = {
    id: nextId("t"),
    title: input.title.trim(),
    description: input.description.trim(),
    assigneeId: assignee.id,
    creatorId: actor.id,
    status: "todo",
    priority: input.priority,
    due: input.due,
    note: null,
    updatedAt: new Date().toISOString(),
  };
  db().tasks.push(task);
  logAudit(actor, "task_create", task.title);
  return ok(view(actor, task));
}

type TaskPatch =
  Partial<TaskCreateInput> | { status: TaskStatus; note?: string | undefined };

export function updateTask(
  actor: Person,
  id: string,
  patch: TaskPatch,
): Result<TaskView> {
  const task = db().tasks.find((t) => t.id === id);
  if (!task || !canSee(actor, task)) return fail("notFound");

  if ("status" in patch && patch.status) {
    const next = patch.status;
    if (!allowedMoves(actor, task).includes(next)) {
      return fail(
        task.assigneeId === actor.id && next === "done"
          ? "forbidden"
          : "invalidTransition",
      );
    }
    const returning = task.status === "review" && next === "in_progress";
    const note = patch.note?.trim() ?? "";
    if (returning && note.length < 3) return fail("noteRequired");
    task.status = next;
    task.note = returning ? note : null;
  } else {
    if (!canManage(actor, task)) return fail("forbidden");
    const fields = patch as Partial<TaskCreateInput>;
    if (Object.keys(fields).length === 0) return fail("empty");
    if (fields.assigneeId !== undefined) {
      const assignee = assignablePeople(actor).find((p) => p.id === fields.assigneeId);
      if (!assignee) return fail("invalidAssignee");
      task.assigneeId = assignee.id;
    }
    if (fields.title !== undefined) task.title = fields.title.trim();
    if (fields.description !== undefined) task.description = fields.description.trim();
    if (fields.priority !== undefined) task.priority = fields.priority;
    if (fields.due !== undefined) task.due = fields.due;
  }
  task.updatedAt = new Date().toISOString();
  logAudit(actor, "task_update", task.title);
  return ok(view(actor, task));
}

export function deleteTask(actor: Person, id: string): Result<null> {
  const task = db().tasks.find((t) => t.id === id);
  if (!task || !canSee(actor, task)) return fail("notFound");
  if (!canManage(actor, task)) return fail("forbidden");
  db().tasks = db().tasks.filter((t) => t.id !== id);
  logAudit(actor, "task_delete", task.title);
  return ok(null);
}

// ---------------------------------------------------------------- jamoa ko'rinishi va statistika

export type TeamRow = Person & { open: number; review: number; done: number };

export function teamRows(actor: Person): TeamRow[] {
  return teamOf(actor).map((p) => {
    const mine = db().tasks.filter((t) => t.assigneeId === p.id);
    return {
      ...p,
      open: mine.filter((t) => t.status === "todo" || t.status === "in_progress").length,
      review: mine.filter((t) => t.status === "review").length,
      done: mine.filter((t) => t.status === "done").length,
    };
  });
}

export function managerNameOf(person: Person): string | null {
  return person.managerId ? (byId(person.managerId)?.name ?? null) : null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function statsFor(actor: Person) {
  const mine = db().tasks.filter((t) => canSee(actor, t));
  const today = todayIso();
  const open = mine.filter((t) => t.status !== "done");
  return {
    users: db().people.filter((p) => p.active).length,
    teamTasks: open.length,
    pending: mine.filter((t) => t.status === "review" && canManage(actor, t)).length,
    late: open.filter((t) => t.due < today).length,
    myTasks: mine.filter((t) => t.assigneeId === actor.id && t.status !== "done").length,
    doneWeek: mine.filter((t) => t.assigneeId === actor.id && t.status === "done").length,
  };
}

export type { Role, TaskView };
