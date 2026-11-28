import type { Role } from "@/lib/auth/roles";
import type { Priority, TaskStatus } from "@/lib/schemas/directory";
import type { DocCategory } from "@/lib/schemas/sections";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: Role;
  dept: string;
  managerId: string | null;
  active: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  creatorId: string;
  status: TaskStatus;
  priority: Priority;
  /** YYYY-MM-DD */
  due: string;
  /** Rahbar vazifani qaytarganda yozgan izoh. */
  note: string | null;
  updatedAt: string;
};

export type TaskView = Task & {
  assigneeName: string;
  creatorName: string;
  /** Joriy foydalanuvchi bu vazifada nima qila oladi (UI tugmalari uchun). */
  can: { manage: boolean; advance: TaskStatus[] };
};

/** Hujjatga biriktirilgan fayl metama'lumoti (baytlarning o'zi `files.ts` omborida). */
export type DocFile = { name: string; size: number; mime: string };

export type Doc = {
  id: string;
  title: string;
  category: DocCategory;
  description: string;
  ownerId: string;
  /** Hamma ko'ra oladimi (aks holda faqat egasi, uning rahbari va admin). */
  shared: boolean;
  updatedAt: string;
  file?: DocFile;
};

export type DocView = Doc & { ownerName: string; canDelete: boolean };

export const AUDIT_ACTIONS = [
  "user_create",
  "user_update",
  "user_delete",
  "task_create",
  "task_update",
  "task_delete",
  "doc_create",
  "doc_delete",
  "doc_download",
  "settings_update",
  "profile_update",
  "password_change",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEntry = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  /** Nima ustida amal bajarildi (ism yoki sarlavha). */
  target: string;
};

export type Settings = {
  companyName: string;
  aiEnabled: boolean;
  emailNotifications: boolean;
};
