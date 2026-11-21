# AI Ops: biznes operatsion platformasi

Korxona rahbari va xodimlari uchun boshqaruv paneli. Next.js 16, TypeScript (strict), Tailwind CSS 4 va Ant Design asosida.

**Holat:** 2-hafta tugagan (1: poydevor, dizayn tizimi, Light/Dark, Login/Logout/parolni tiklash, rolli kirish; 2: Sidebar, Header, Navigation, tezkor qidiruv, bildirishnomalar). Haftalik hisobotlar: [`reports/`](./reports).

## Ishga tushirish

```bash
npm install
cp .env.example .env.local        # SESSION_SECRET ni to'ldiring (kamida 32 belgi)
npm run dev                       # http://localhost:3000  ->  /uz/login
```

Kalit yaratish:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Demo hisoblar (mock)

Rol login formasida tanlanmaydi, email va paroldan avtomatik aniqlanadi.

| Rol    | Email               | Parol           |
| ------ | ------------------- | --------------- |
| Admin  | `admin@aiops.uz`    | `Admin#2026`    |
| Rahbar | `manager@aiops.uz`  | `Manager#2026`  |
| Xodim  | `employee@aiops.uz` | `Employee#2026` |

Production build'da mock kirish faqat `MOCK_AUTH_ENABLED=true` bo'lganda ishlaydi va login sahifasida demo hisoblar ro'yxati ko'rinadi. **Ochiq internetga chiqariladigan muhitda buni o'chiring.**

## Rollar

- **Admin:** barcha bo'limlar, xodim qo'shish, rollar va tizim sozlamalari.
- **Rahbar:** butun korxonani ko'radi (faqat o'qish), o'z jamoasiga vazifa tayinlaydi va tasdiqlaydi. Xodim qo'sha olmaydi.
- **Xodim:** o'z vazifalari, hujjatlari, AI yordamchi va profil.

Ruxsatlar bitta joyda: [`src/lib/auth/roles.ts`](./src/lib/auth/roles.ts). Himoya uch qatlamda: `src/proxy.ts` (har so'rovda), `(app)/layout.tsx` va har sahifada serverda qayta tekshiruv.

## Skriptlar

| Buyruq              | Vazifa                                 |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Ishlab chiqish serveri                 |
| `npm run build`     | Production build                       |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | TypeScript tekshiruvi                  |
| `npm run format`    | Prettier                               |
| `npm run test:e2e`  | Playwright E2E (avval `npm run build`) |

E2E uchun bir marta `npx playwright install chromium` kerak. Tayyor Chromium bo'lsa, `PW_CHROMIUM_PATH=/yo'l/chrome` bilan ishga tushirish mumkin. Testlar production serverda (`next start`) ishlaydi.

`git commit` oldidan Husky `lint-staged` va `typecheck` ni ishga tushiradi.

## Tuzilma

```
src/
  app/[locale]/(auth)/    login, forgot-password, reset-password
  app/[locale]/(app)/     himoyalangan panel (dashboard, bo'limlar)
  app/api/auth/           login, logout, forgot-password, reset-password
  components/             ui/, auth/, layout/, providers/
  i18n/                   next-intl sozlamalari (uz, ru, en)
  lib/auth/               rollar, token, sessiya, Zod sxemalari
  lib/mock/               MOCK hisoblar (backend ulanganda olib tashlanadi)
  messages/               uz.json, ru.json, en.json
  proxy.ts                til + sessiya + rol himoyasi
e2e/                      Playwright testlari
reports/                  haftalik hisobotlar
```

## Backend ulanganda

1. `src/lib/mock/users.ts` dagi `verifyCredentials` ni API chaqiruviga almashtiring.
2. `forgot-password` va `reset-password` route'lariga haqiqiy pochta va bir martalik token qo'shing.
3. `MOCK_AUTH_ENABLED` va `src/lib/mock/` ni olib tashlang.
4. Xotiradagi `rateLimit` ni markaziy (masalan Redis) limitga almashtiring.
