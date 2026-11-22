import { z } from "zod";
import { ROLES } from "@/lib/auth/roles";

/**
 * Foydalanuvchi va vazifa sxemalari. Brauzer (RHF) ham, server (API) ham shu sxemadan foydalanadi.
 * Xabarlar o'rniga kalitlar: klient ularni t("forms.validation.<kalit>") orqali tarjima qiladi.
 */
export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

const email = z
  .string()
  .trim()
  .min(1, "emailRequired")
  .max(254, "emailInvalid")
  .pipe(z.email("emailInvalid"))
  .transform((value) => value.toLowerCase());

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
  email,
  role: z.enum(ROLES, "roleRequired"),
  dept: z.string().trim().min(2, "deptRequired").max(60, "deptTooLong"),
  managerId: z.string().max(40).nullable().optional(),
});
export type UserCreateInput = z.input<typeof userCreateSchema>;
export type UserCreateOutput = z.output<typeof userCreateSchema>;

/** Tahrirlashda email o'zgarmaydi (identifikator), qolganlari ixtiyoriy. */
export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
    role: z.enum(ROLES, "roleRequired"),
    dept: z.string().trim().min(2, "deptRequired").max(60, "deptTooLong"),
    managerId: z.string().max(40).nullable(),
    active: z.boolean(),
  })
  .partial();
export type UserUpdateInput = z.input<typeof userUpdateSchema>;

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueInvalid")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "dueInvalid");

export const taskCreateSchema = z.object({
  title: z.string().trim().min(3, "titleRequired").max(120, "titleTooLong"),
  description: z.string().trim().max(600, "descriptionTooLong"),
  assigneeId: z.string().min(1, "assigneeRequired").max(40),
  priority: z.enum(PRIORITIES, "priorityRequired"),
  due: dueDate,
});
export type TaskCreateInput = z.input<typeof taskCreateSchema>;

/**
 * Vazifani yangilash: yoki maydonlar (rahbar/admin), yoki holat o'zgartirish.
 * `note` faqat tekshiruvdan qaytarishda majburiy (serverda tekshiriladi).
 */
export const taskUpdateSchema = z.union([
  taskCreateSchema.partial().strict(),
  z.object({
    status: z.enum(TASK_STATUSES),
    note: z.string().trim().max(300, "noteTooLong").optional(),
  }),
]);
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;

export const returnNoteSchema = z.object({
  note: z.string().trim().min(3, "noteRequired").max(300, "noteTooLong"),
});
