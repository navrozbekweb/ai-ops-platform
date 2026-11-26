# Hafta 1 hisobi

## Qilingan ishlar

- 21.11 Next.js 16 (App Router) loyihasini `ai-ops-platform` nomi bilan yaratdim: TypeScript `strict`, Tailwind CSS 4 va Ant Design 6. GitHub repository'ga ulab, birinchi commitni push qildim.
- 21.11 Sifat vositalarini sozladim: `ESLint`, `Prettier` (Tailwind plagini bilan), `Husky` + `lint-staged`. Commit oldidan format, lint va `typecheck` avtomatik ishlaydi.
- 21.11 Xavfsizlik sarlavhalarini qo'shdim (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), `X-Powered-By` ni o'chirdim.
- 21.11 Dizayn tizimini yaratdim: `--bg`, `--surface`, `--border`, `--accent`, `--sidebar` rang tokenlari Light va Dark uchun alohida, Tailwind va Ant Design bir xil qiymatlardan foydalanadi.
- 21.11 Shriftlarni `@fontsource` orqali ulab, Inter va Playfair Display'ni tashqi ulanishsiz ishlatdim.
- 21.11 Umumiy komponentlar yozdim: `Button`, `TextField` (label, xato matni, `aria-*`), `LanguageSwitcher`, `ThemeToggle`, `AuthCard`.
- 21.11 Light/Dark/Tizim rejimini qo'shdim: tanlov `aiops_theme` cookie'sida saqlanadi, server birinchi chizishdayoq to'g'ri sinfni beradi, Ant Design `darkAlgorithm` bilan sinxron almashadi.
- 21.11 `next-intl` bilan uch tilli interfeys (o'zbek, rus, ingliz) qurdim: tarjimalar `src/messages/` ichida, til almashganda sahifa yo'li saqlanadi.
- 21.11 Login sahifasini "Spotlight" uslubida yaratdim (kursor ortidan ochiladigan qatlam, sensorli qurilmada va "harakatni kamaytirish" yoqilganda statik).
- 21.11 Parolni unutdim va yangi parol sahifalarini yozdim: token 15 daqiqa amal qiladi, parol qoidasi brauzerda ham, serverda ham bir xil `Zod` sxemasi bilan tekshiriladi. Logout sessiya cookie'sini o'chiradi.
- 21.11 Uch rol (admin, rahbar, xodim) tizimini yozdim: rol login formasida tanlanmaydi, email va paroldan avtomatik aniqlanadi. Ruxsatlar bitta joyda (`src/lib/auth/roles.ts`), himoya uch qatlamda: `proxy.ts`, `(app)/layout.tsx` va har sahifada serverda.
- 21.11 Sessiyani imzolangan JWT (`jose`, HS256, `httpOnly`, 8 soat) bilan, mock parollarni `scrypt` bilan yozdim; login uchun urinishlar limiti, `Origin` tekshiruvi va `?next=` uchun open redirect himoyasini qo'shdim.
- 21.11 Responsive qildim: kompyuterda doimiy sidebar, telefonda menyu tugmasi va `Drawer`.
- 21.11 20 ta Playwright E2E test yozdim (himoya, uch rolda kirish, parolni tiklash, til, tungi rejim, telefon). Lint, typecheck, build va testlar o'tdi.

## Muammolar

- Tungi rejim sahifa yangilangandan keyin saqlanmadi.
- Next.js 16 da `middleware` nomi o'zgargan, shablon bilan kelgan `cacheComponents` esa panel uchun ortiqcha murakkablik berdi.
- `next/font/google` build vaqtida tashqi tarmoqqa ulanadi va yopiq muhitda build yiqilishi mumkin edi.
- Tailwind 4 va Ant Design stillari bir-birini bosib ketdi.
- Ildiz sahifa brauzer tiliga qarab `/en` ga yo'naltirardi.
- Testlarda parol maydoni locator'i sarlavha va Next.js'ning o'z `role="alert"` elementi bilan adashdi.

## Yechim

- Cookie nomi doimiysi `"use client"` faylida edi va serverga matn o'rniga havola bo'lib kelardi. Uni oddiy umumiy faylga (`src/lib/theme.ts`) ko'chirdim va test qo'shdim.
- Loyiha ichidagi rasmiy hujjatni o'qib, `middleware` o'rniga `proxy.ts` yozdim, `cacheComponents` ni o'chirdim.
- Shriftlarni `@fontsource` paketlariga almashtirdim.
- CSS qatlam tartibini `@layer theme, base, antd, components, utilities` va `AntdRegistry layer` bilan belgiladim.
- `localeDetection` ni o'chirdim: platforma asosan o'zbekcha, ildiz sahifa doim `/uz` ga olib boradi.
- Testlarda aniq nom va matn bo'yicha qidirishga o'tdim.
