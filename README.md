# ai-ops-platform

Korxona rahbari va xodimlari uchun AI biznes operatsion platformasi: rolga qarab ishlaydigan boshqaruv paneli. Next.js 16 (App Router), TypeScript `strict`, Tailwind CSS 4 va Ant Design 6 asosida. Uch rol (admin, rahbar, xodim), uch til (o'zbek, rus, ingliz), Light/Dark rejim, serverda tekshiriladigan ruxsatlar va mock backend.

## Hisobotlar

- [Hafta 1 hisobi](./docs/weekly/hafta-1.md)
- [Hafta 2 hisobi](./docs/weekly/hafta-2.md)
- [Hafta 3 hisobi](./docs/weekly/hafta-3.md)
- [Hafta 4 hisobi](./docs/weekly/hafta-4.md)

## Loyiha tuzilmasi

```
src/
├── app/
│   ├── [locale]/(auth)/        # Login, parolni unutdim, yangi parol
│   ├── [locale]/(app)/         # Himoyalangan panel (dashboard, vazifalar, foydalanuvchilar, jamoa...)
│   └── api/
│       ├── auth/               # login, logout, forgot-password, reset-password, session-expired
│       ├── users/              # Foydalanuvchilar API (mock, ruxsat serverda tekshiriladi)
│       └── tasks/              # Vazifalar API (mock, ruxsat serverda tekshiriladi)
├── components/
│   ├── ui/                     # Modal, ConfirmDialog, DataTable, forma maydonlari, Badge, Toast, Popover
│   ├── layout/                 # AppShell, Sidebar, Header, Breadcrumbs, CommandPalette, bildirishnomalar
│   ├── auth/                   # Login va parol formalari
│   ├── users/ tasks/ team/     # Sahifa komponentlari
│   └── providers/              # Mavzu va Ant Design provayderlari
├── i18n/                       # next-intl sozlamalari (uz, ru, en)
├── lib/
│   ├── auth/                   # Rollar, token, sessiya, Zod sxemalari
│   ├── api/                    # API himoyasi: aktyor, limit, javoblar
│   ├── data/                   # Mock ombor va servis (backend ulanganda almashtiriladi)
│   ├── mock/                   # Mock hisoblar va bildirishnomalar
│   └── schemas/                # Umumiy Zod sxemalari
├── messages/                   # uz.json, ru.json, en.json
└── proxy.ts                    # Til + sessiya + rol himoyasi
e2e/                            # Playwright testlari (kirish, navigatsiya, API, axe, responsive)
scripts/                        # check-i18n.mjs (tarjimalar to'liqligi)
docs/weekly/                    # Haftalik hisobotlar
```

## Ishni boshlash

1. Bog'liqliklarni o'rnatish:

   ```bash
   npm install
   ```

2. Sozlama faylini yaratish va maxfiy kalitni yozish (kamida 32 belgi):

   ```bash
   cp .env.example .env.local
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Chiqqan kalitni `.env.local` dagi `SESSION_SECRET=` dan keyin qo'ying.

3. Tekshiruv:

   ```bash
   npm run typecheck
   npm run lint
   npm run check:i18n
   ```

4. Ilovani ishga tushirish:

   ```bash
   npm run dev
   ```

   Brauzerda `http://localhost:3000` ochiladi va `/uz/login` ga yo'naltiradi.

## Demo hisoblar (mock)

Rol login formasida tanlanmaydi, email va paroldan avtomatik aniqlanadi.

| Rol    | Email               | Parol           |
| ------ | ------------------- | --------------- |
| Admin  | `admin@aiops.uz`    | `Admin#2026`    |
| Rahbar | `manager@aiops.uz`  | `Manager#2026`  |
| Xodim  | `employee@aiops.uz` | `Employee#2026` |

Production build'da mock kirish faqat `MOCK_AUTH_ENABLED=true` bo'lganda ishlaydi va login sahifasida demo hisoblar ro'yxati ko'rinadi. **Ochiq internetga chiqariladigan muhitda buni o'chiring.**

## Rollar

- **Admin:** barcha bo'limlar, foydalanuvchilarni boshqarish, rollar va tizim sozlamalari.
- **Rahbar:** butun korxonani ko'radi (faqat o'qish), o'z jamoasiga vazifa tayinlaydi va tasdiqlaydi. Xodim qo'sha olmaydi.
- **Xodim:** o'z vazifalari, hujjatlari, AI yordamchi va profil.

Ruxsatlar bitta joyda: [`src/lib/auth/roles.ts`](./src/lib/auth/roles.ts). Himoya uch qatlamda: `src/proxy.ts` (har so'rovda), `(app)/layout.tsx` va har sahifada serverda qayta tekshiruv. API ham ruxsatni serverda tekshiradi.

## Skriptlar

| Buyruq               | Vazifa                                 |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Ishlab chiqish serveri                 |
| `npm run build`      | Production build                       |
| `npm run lint`       | ESLint                                 |
| `npm run typecheck`  | TypeScript tekshiruvi                  |
| `npm run check:i18n` | Tarjimalar to'liqligi (uz, ru, en)     |
| `npm run format`     | Prettier                               |
| `npm run test:e2e`   | Playwright E2E (avval `npm run build`) |

E2E uchun bir marta `npx playwright install chromium` kerak. Tayyor Chromium bo'lsa, `PW_CHROMIUM_PATH=/yo'l/chrome` bilan ishga tushirish mumkin. Testlar production serverda (`next start`) ishlaydi. `git commit` oldidan Husky `lint-staged` va `typecheck` ni ishga tushiradi.

## Backend ulanganda

1. `src/lib/mock/users.ts` dagi `verifyCredentials` va `src/lib/data/service.ts` funksiyalarini API chaqiruvlariga almashtiring.
2. `forgot-password` va `reset-password` route'lariga haqiqiy pochta va bir martalik token qo'shing.
3. `MOCK_AUTH_ENABLED` va `src/lib/mock/` ni olib tashlang.
4. Xotiradagi `rateLimit` ni markaziy (masalan Redis) limitga almashtiring.
