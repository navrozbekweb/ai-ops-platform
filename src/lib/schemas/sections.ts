import { z } from "zod";
import { routing } from "@/i18n/routing";
import { strongPassword } from "@/lib/auth/schemas";

/**
 * Profil, hujjatlar, sozlamalar va AI chat sxemalari. Brauzer (RHF) ham, server (API) ham
 * shu sxemadan foydalanadi. Xabarlar o'rniga kalitlar: t("forms.validation.<kalit>").
 */
export const DOC_CATEGORIES = ["contract", "report", "policy", "other"] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const profileSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "currentRequired").max(128, "currentRequired"),
    password: strongPassword,
    confirm: z.string().min(1, "passwordMismatch"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "passwordMismatch",
  });
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;

export const docCreateSchema = z.object({
  title: z.string().trim().min(3, "titleRequired").max(120, "titleTooLong"),
  category: z.enum(DOC_CATEGORIES, "categoryRequired"),
  description: z.string().trim().max(600, "descriptionTooLong"),
  shared: z.boolean(),
});
export type DocCreateInput = z.input<typeof docCreateSchema>;

export const settingsSchema = z.object({
  companyName: z.string().trim().min(2, "companyRequired").max(80, "companyTooLong"),
  aiEnabled: z.boolean(),
  emailNotifications: z.boolean(),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, "messageRequired").max(500, "messageTooLong"),
  locale: z.enum(routing.locales),
  /** Oldingi suhbat (haqiqiy AI uchun kontekst). Brauzer oxirgi 8 tasini, har biri 500 belgigacha yuboradi. */
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(500) }))
    .max(8)
    .optional(),
});
export type AiChatInput = z.input<typeof aiChatSchema>;
