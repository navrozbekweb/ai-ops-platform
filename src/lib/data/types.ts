import type { Role } from "@/lib/auth/roles";
import type { Priority, TaskStatus } from "@/lib/schemas/directory";

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
