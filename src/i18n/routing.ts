import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uz", "ru", "en"],
  defaultLocale: "uz",
  localePrefix: "always",
  // Platforma asosan o'zbek tilida: ildiz sahifa brauzer tilidan qat'i nazar /uz ga ochiladi.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
