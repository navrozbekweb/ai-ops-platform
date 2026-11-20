import { z } from "zod";
import { routing } from "@/i18n/routing";

/**
 * Xabarlar o'rniga kalitlar ishlatiladi: klient ularni t("auth.validation.<kalit>")
 * orqali tarjima qiladi. Bir xil sxema ham brauzerda, ham serverda ishlaydi.
 */
const email = z
  .string()
  .trim()
  .min(1, "emailRequired")
  .max(254, "emailInvalid")
  .pipe(z.email("emailInvalid"))
  .transform((value) => value.toLowerCase());

export const strongPassword = z
  .string()
  .min(8, "passwordWeak")
  .max(128, "passwordWeak")
  .regex(/[a-z]/, "passwordWeak")
  .regex(/[A-Z]/, "passwordWeak")
  .regex(/\d/, "passwordWeak");

const locale = z.enum(routing.locales);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired").max(128, "passwordRequired"),
  locale,
});

export const forgotSchema = z.object({ email, locale });

export const resetSchema = z
  .object({
    token: z.string().min(10).max(2048),
    password: strongPassword,
    confirm: z.string().min(1, "passwordMismatch"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "passwordMismatch",
  });

export type LoginInput = z.input<typeof loginSchema>;
export type ForgotInput = z.input<typeof forgotSchema>;
export type ResetInput = z.input<typeof resetSchema>;
