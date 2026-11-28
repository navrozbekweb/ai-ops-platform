import "server-only";
import { changePassword } from "@/lib/mock/users";
import type {
  DocCreateInput,
  PasswordChangeInput,
  ProfileInput,
  SettingsInput,
} from "@/lib/schemas/sections";
import { TASK_STATUSES, type TaskStatus } from "@/lib/schemas/directory";
import { readFile, removeFile, saveFile, validateUpload } from "./files";
import { fail, ok, todayIso, type Result } from "./service";
import { db, logAudit, nextId } from "./store";
import type { AuditEntry, Doc, DocFile, DocView, Person, Settings } from "./types";

/**
 * Profil, hujjatlar, audit, sozlamalar va tahlil. Ruxsatlar shu yerda (serverda) tekshiriladi.
 */

// ---------------------------------------------------------------- profil

export function updateProfile(actor: Person, input: ProfileInput): Result<Person> {
  const self = db().people.find((p) => p.id === actor.id);
  if (!self) return fail("notFound");
  self.name = input.name.trim();
  logAudit(self, "profile_update", self.name);
  return ok(self);
}

export function changeOwnPassword(
  actor: Person,
  input: Pick<PasswordChangeInput, "current" | "password">,
): Result<null> {
  if (!changePassword(actor.id, input.current, input.password)) {
    return fail("wrongPassword");
  }
  logAudit(actor, "password_change", actor.name);
  return ok(null);
}

// ---------------------------------------------------------------- hujjatlar

function managerOf(personId: string): string | null {
  return db().people.find((p) => p.id === personId)?.managerId ?? null;
}

function canSeeDoc(actor: Person, doc: Doc): boolean {
  if (actor.role === "admin" || doc.shared || doc.ownerId === actor.id) return true;
  return actor.role === "manager" && managerOf(doc.ownerId) === actor.id;
}

function docView(actor: Person, doc: Doc): DocView {
  return {
    ...doc,
    ownerName: db().people.find((p) => p.id === doc.ownerId)?.name ?? "-",
    canDelete: actor.role === "admin" || doc.ownerId === actor.id,
  };
}

export function listDocs(actor: Person): DocView[] {
  return db()
    .docs.filter((doc) => canSeeDoc(actor, doc))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((doc) => docView(actor, doc));
}

export type UploadedFile = { name: string; bytes: Uint8Array };

export function createDoc(
  actor: Person,
  input: DocCreateInput,
  upload?: UploadedFile,
): Result<DocView> {
  let file: DocFile | undefined;
  if (upload) {
    const checked = validateUpload(upload.name, upload.bytes);
    if (!checked.ok) return checked;
    file = checked.value;
  }
  const doc: Doc = {
    id: nextId("d"),
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    ownerId: actor.id,
    shared: input.shared,
    updatedAt: new Date().toISOString(),
    ...(file ? { file } : {}),
  };
  if (upload && file) {
    const saved = saveFile(doc.id, upload.bytes);
    if (!saved.ok) return saved;
  }
  db().docs.push(doc);
  logAudit(actor, "doc_create", doc.title);
  return ok(docView(actor, doc));
}

export function deleteDoc(actor: Person, id: string): Result<null> {
  const doc = db().docs.find((d) => d.id === id);
  if (!doc || !canSeeDoc(actor, doc)) return fail("notFound");
  if (!(actor.role === "admin" || doc.ownerId === actor.id)) return fail("forbidden");
  db().docs = db().docs.filter((d) => d.id !== id);
  removeFile(id);
  logAudit(actor, "doc_delete", doc.title);
  return ok(null);
}

/** Faylni yuklab olish: ko'rish huquqi hujjatniki bilan bir xil. Boshqaga "topilmadi" deyiladi. */
export function downloadDocFile(
  actor: Person,
  id: string,
): Result<{ file: DocFile; bytes: Uint8Array }> {
  const doc = db().docs.find((d) => d.id === id);
  if (!doc || !canSeeDoc(actor, doc) || !doc.file) return fail("notFound");
  const bytes = readFile(id);
  if (!bytes) return fail("notFound");
  logAudit(actor, "doc_download", doc.title);
  return ok({ file: doc.file, bytes });
}

// ---------------------------------------------------------------- audit jurnali

export function listAudit(actor: Person): Result<AuditEntry[]> {
  if (actor.role !== "admin") return fail("forbidden");
  return ok([...db().audit]);
}

// ---------------------------------------------------------------- sozlamalar

export function getSettings(): Settings {
  return { ...db().settings };
}

export function updateSettings(actor: Person, input: SettingsInput): Result<Settings> {
  if (actor.role !== "admin") return fail("forbidden");
  db().settings = {
    companyName: input.companyName.trim(),
    aiEnabled: input.aiEnabled,
    emailNotifications: input.emailNotifications,
  };
  logAudit(actor, "settings_update", db().settings.companyName);
  return ok(getSettings());
}

// ---------------------------------------------------------------- tahlil

export type Analytics = {
  totals: { tasks: number; done: number; open: number; late: number; rate: number };
  byStatus: { status: TaskStatus; count: number }[];
  byDept: { dept: string; open: number; done: number }[];
  byPerson: { id: string; name: string; open: number; done: number; late: number }[];
};

/** Butun korxona bo'yicha (admin va rahbar uchun, faqat o'qish). */
export function analytics(actor: Person): Result<Analytics> {
  if (actor.role === "employee") return fail("forbidden");
  const { tasks, people } = db();
  const today = todayIso();
  const done = tasks.filter((t) => t.status === "done").length;
  const open = tasks.length - done;
  const personOf = (id: string) => people.find((p) => p.id === id);

  const depts = new Map<string, { open: number; done: number }>();
  for (const task of tasks) {
    const dept = personOf(task.assigneeId)?.dept ?? "-";
    const row = depts.get(dept) ?? { open: 0, done: 0 };
    if (task.status === "done") row.done += 1;
    else row.open += 1;
    depts.set(dept, row);
  }

  const byPerson = people
    .filter((p) => p.active && tasks.some((t) => t.assigneeId === p.id))
    .map((p) => {
      const mine = tasks.filter((t) => t.assigneeId === p.id);
      return {
        id: p.id,
        name: p.name,
        open: mine.filter((t) => t.status !== "done").length,
        done: mine.filter((t) => t.status === "done").length,
        late: mine.filter((t) => t.status !== "done" && t.due < today).length,
      };
    })
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

  return ok({
    totals: {
      tasks: tasks.length,
      done,
      open,
      late: tasks.filter((t) => t.status !== "done" && t.due < today).length,
      rate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
    byStatus: TASK_STATUSES.map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    })),
    byDept: [...depts.entries()]
      .map(([dept, v]) => ({ dept, ...v }))
      .sort((a, b) => b.open + b.done - (a.open + a.done)),
    byPerson,
  });
}
