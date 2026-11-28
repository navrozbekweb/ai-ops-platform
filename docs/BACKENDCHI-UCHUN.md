# Backendchi uchun qo'llanma

Bu hujjat loyihani birinchi marta olgan backend dasturchi uchun: avval **o'rnatish ketma-ketligi**, keyin **nimani backendga almashtirish kerakligi**.

## 1. O'rnatish ketma-ketligi

Kerak: **Node.js 22 yoki yangiroq**, npm 10+, Git (ixtiyoriy).

```bash
# 1) Zipni oching (yoki git clone) va papkaga kiring
unzip ai-ops-platform-backendchi-uchun.zip && cd ai-ops-platform
#    GitHub'dan: git clone https://github.com/navrozbekweb/ai-ops-platform.git && cd ai-ops-platform

# 2) Paketlarni o'rnating (package-lock.json bo'yicha aniq versiyalar)
npm ci

# 3) Muhit o'zgaruvchilari fayli
cp .env.example .env.local
#    .env.local ichida SESSION_SECRET ni to'ldiring (kamida 32 belgi):
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    MOCK_AUTH_ENABLED=true qoldiring (hozircha demo kirish shu bilan ishlaydi)

# 4) Ishga tushiring
npm run dev            # http://localhost:3000  (til: /uz, /ru, /en)
```

Demo hisoblar (mock): `admin@aiops.uz / Admin#2026`, `manager@aiops.uz / Manager#2026`, `employee@aiops.uz / Employee#2026`.
Login sahifasida ular ko'rinishi uchun `.env.local` ga `SHOW_DEMO_ACCOUNTS=true` qo'shing.

Tekshiruvlar (har o'zgarishdan keyin):

```bash
npm run lint && npm run typecheck && npm run check:i18n
npm run build && npm run start      # production rejimi, http://localhost:3000
```

E2E testlar (ixtiyoriy, birinchi marta brauzer kerak): `npx playwright install chromium`, so'ng `npm run build && npm run test:e2e`.
Testlar 3 ta serverni o'zi ko'taradi (3100: ilova, 3101: soxta Anthropic, 3102: AI kalitli ilova), hammasi lokal.

## 2. Arxitektura (qisqacha)

```
Brauzer (React, Ant Design, RHF+Zod)
   │  fetch("/api/...")   ← src/lib/client/api.ts
   ▼
src/app/api/**/route.ts      HTTP qatlami: sessiya, CSRF (Origin), Zod validatsiya, javob shakli
   ▼
src/lib/data/service.ts      ← BIZNES QOIDALAR va RUXSATLAR (foydalanuvchilar, vazifalar)
src/lib/data/sections.ts     ← hujjatlar, audit, sozlamalar, profil, tahlil
   ▼
src/lib/data/store.ts        ← XOTIRADAGI "baza" (globalThis). Shu yerni DB bilan almashtirasiz
src/lib/mock/users.ts        ← demo parollar (scrypt). Haqiqiy autentifikatsiya bilan almashadi
```

Sahifalar (`src/app/[locale]/(app)/*/page.tsx`) server komponentlar: ma'lumotni to'g'ridan-to'g'ri `service.ts`/`sections.ts` dan oladi (HTTP'siz), o'zgartirishlar esa `/api/*` orqali ketadi.

**Muhim:** ruxsat qoidalari (kim nimani ko'radi/qila oladi) hozir `service.ts` va `sections.ts` ichida. Backend ularni o'zida qayta amalga oshirishi shart; frontend tugmalarni yashirishi faqat qulaylik, himoya emas.

## 3. Nimani almashtirish kerak

| Hozir (mock)                                                    | Backendda                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/lib/data/store.ts` (xotira, restartda yo'qoladi)           | Ma'lumotlar bazasi (jadvallar quyida). `db()` chaqiruvlari repository funksiyalariga |
| `src/lib/data/service.ts`, `sections.ts` funksiyalari           | Backend API chaqiruvlari yoki bazaga so'rovlar; ruxsat qoidalari backendda           |
| `src/lib/mock/users.ts` (`verifyCredentials`, `changePassword`) | Haqiqiy foydalanuvchi bazasi, parol hash (argon2id/bcrypt/scrypt), login tekshiruvi  |
| `src/app/api/auth/forgot-password`, `reset-password`            | Pochta yuborish va bir martalik token (hozir demo havola javobda qaytadi)            |
| `src/lib/ai/mock.ts`                                            | Kerak emas bo'lsa o'chiring; `live.ts` kalit bilan Claude'ga ulanadi                 |
| `src/lib/mock/notifications.ts`                                 | Bildirishnomalar API'si                                                              |
| `rateLimit` (`src/lib/api/guard.ts`, xotirada)                  | Markaziy limit (Redis va h.k.): serverless/ko'p nusxada xotira limiti ishlamaydi     |
| `MOCK_AUTH_ENABLED`, `SHOW_DEMO_ACCOUNTS`                       | Olib tashlang (production'da mock kirish o'chiq bo'lishi kerak)                      |

Eng kam o'zgarish yo'li: `service.ts`/`sections.ts` funksiyalarining **imzosini saqlab**, ichini bazaga ko'chirish (ular allaqachon `Result<T>` qaytaradi va xato kodlari tayyor). Shunda sahifalar va API route'lar deyarli o'zgarmaydi. Ular hozir sinxron; bazaga o'tganda `async` bo'ladi va chaqiruvchilarga `await` qo'shiladi (TypeScript xatolari hammasini ko'rsatadi).

## 4. Rollar va bo'limlar

Rollar: `admin`, `manager` (rahbar), `employee` (xodim). Bitta kirish formasi, rol email+parol bo'yicha aniqlanadi.
Bo'limlarga kirish `src/lib/auth/roles.ts` da (`NAV_GROUPS_BY_ROLE`): proxy (`src/proxy.ts`) shu bo'yicha yo'naltiradi.

| Bo'lim                        | admin | manager | employee |
| ----------------------------- | :---: | :-----: | :------: |
| dashboard, profile            |   ✓   |    ✓    |    ✓     |
| tasks, documents, ai          |   ✓   |    ✓    |    ✓     |
| analytics (faqat o'qish)      |   ✓   |    ✓    |          |
| team, approvals               |       |    ✓    |          |
| users, roles, audit, settings |   ✓   |         |          |

Ma'lumot ko'rinishi:

- **Vazifa:** admin hammasini; rahbar o'zi yaratgan va jamoasiga tegishlilarini; xodim faqat o'zinikini. O'z vazifasini o'zi tasdiqlay olmaydi.
- **Hujjat:** admin hammasini; rahbar o'zining, jamoasining va umumiylarni; xodim o'zining va umumiylarni. O'chirish: muallif yoki admin.
- **Vazifa holatlari:** xodim `todo → in_progress → review` (va orqaga `in_progress → todo`); tekshiruvchi (rahbar/admin) `review → done` yoki `review → in_progress` (qaytarish, izoh majburiy, kamida 3 belgi).
- Oxirgi faol adminni o'zgartirib/o'chirib bo'lmaydi; o'z hisobingizni bloklab/o'chirib bo'lmaydi; ochiq vazifasi bor foydalanuvchini o'chirib bo'lmaydi.

## 5. API shartnomasi

Hamma yo'llar `/api/...`, JSON, sessiya cookie bilan. O'zgartiruvchi so'rovlarda `Origin` sarlavhasi saytniki bo'lishi shart (CSRF qatlami). Muvaffaqiyat: `{ "ok": true, ...ma'lumot }`; xato: `{ "ok": false, "error": "<kod>" }`.
Validatsiya sxemalari (Zod) so'rov tanasining aniq shaklini beradi: `src/lib/auth/schemas.ts`, `src/lib/schemas/directory.ts`, `src/lib/schemas/sections.ts`.

| Metod va yo'l                    | Kim                 | Tana (sxema)                              | Javob                                      |
| -------------------------------- | ------------------- | ----------------------------------------- | ------------------------------------------ |
| POST `/api/auth/login`           | ochiq               | `loginSchema` (email, password, locale)   | `{ ok, role, redirectTo }` + cookie        |
| POST `/api/auth/logout`          | kirgan              | -                                         | `{ ok }`                                   |
| POST `/api/auth/forgot-password` | ochiq               | email                                     | `{ ok }` (hisob borligini oshkor qilmaydi) |
| POST `/api/auth/reset-password`  | token bilan         | token, parol                              | `{ ok }`                                   |
| GET/POST `/api/users`            | admin               | `userCreateSchema`                        | `{ users }` / `{ user }`                   |
| PATCH/DELETE `/api/users/:id`    | admin               | `userUpdateSchema`                        | `{ user }` / `{ ok }`                      |
| GET/POST `/api/tasks`            | rolga qarab         | `taskCreateSchema` (rahbar, admin)        | `{ tasks }` / `{ task }`                   |
| PATCH/DELETE `/api/tasks/:id`    | rolga qarab         | `taskUpdateSchema` (maydonlar yoki holat) | `{ task }` / `{ ok }`                      |
| GET/POST `/api/docs`             | hamma               | `docCreateSchema`                         | `{ docs }` / `{ doc }`                     |
| DELETE `/api/docs/:id`           | muallif, admin      | -                                         | `{ ok }`                                   |
| PATCH `/api/profile`             | o'zi                | `profileSchema` (name)                    | `{ user }`                                 |
| POST `/api/profile/password`     | o'zi                | `passwordChangeSchema`                    | `{ ok }`                                   |
| PATCH `/api/settings`            | admin               | `settingsSchema`                          | `{ settings }`                             |
| POST `/api/ai/chat`              | hamma (AI yoqilgan) | `aiChatSchema` (message, locale, history) | `{ reply, live }`                          |

Xato kodlari va HTTP statuslari (`ApiErrorCode`, `service.ts`): `unauthorized` 401, `forbidden` 403, `notFound` 404, `emailTaken` 409, `selfAction` 409, `lastAdmin` 409, `hasOpenTasks` 409, `invalidTransition` 409, `invalidAssignee` 400, `invalidManager` 400, `noteRequired` 400, `validation` 400, `wrongPassword` 400, `empty` 400, `aiDisabled` 409, `aiUnavailable` 502; qo'shimcha: `rate_limited` 429, `unsupported` 415, `too_large` 413.
Klient bu kodlarni `src/messages/*.json` dagi `apiErrors.<kod>` orqali 3 tilda ko'rsatadi: yangi kod qo'shsangiz, uchala tilga tarjima ham qo'shing (`npm run check:i18n` tekshiradi).

Qo'shimcha endpointlar (hozir yo'q, kerak bo'lishi mumkin): `GET /api/analytics`, `GET /api/audit`, `GET /api/settings`. Hozir bu ma'lumotlarni sahifalar serverda `sections.ts` dan oladi.

## 6. Ma'lumot modeli (jadvallar uchun taklif)

Maydonlar `src/lib/data/types.ts` dagi turlardan:

- **people:** id, name, email (unikal, kichik harf), role, dept, managerId → people, active, passwordHash, createdAt
- **tasks:** id, title, description, assigneeId → people, creatorId → people, status, priority, due (sana), note, updatedAt
- **docs:** id, title, category (`contract|report|policy|other`), description, ownerId → people, shared, updatedAt (keyin: fayl havolasi, hajmi)
- **audit:** id, at, actorId, actorName, action (`user_create…password_change`), target
- **settings:** companyName, aiEnabled, emailNotifications (bitta qator)

Audit yozuvi hozir `service.ts`/`sections.ts` ichidagi har bir o'zgartiruvchi funksiyada `logAudit(...)` bilan yoziladi; backendda ham har o'zgarishda yozilishi kerak.

## 7. Sessiya va xavfsizlik

- Sessiya: imzolangan JWT (HS256, `jose`) `aiops_session` cookie'da: `httpOnly`, `sameSite=lax`, production'da `secure`, muddati 8 soat. Imzo kaliti `SESSION_SECRET` (production'da kamida 32 belgi, aks holda ilova ishga tushmaydi). Backend o'z sessiyasini (masalan, server-side session yoki o'z JWT'i) bersa, `src/lib/auth/session.ts` va `token.ts` ni almashtirish kifoya: qolgan kod faqat `currentActor()` ni (`src/lib/api/actor.ts`) ishlatadi.
- Har so'rovda foydalanuvchi bazadan qayta o'qiladi: bloklangan yoki o'chirilgan hisobning eski sessiyasi darhol yaroqsiz bo'ladi.
- Login: faqat muvaffaqiyatsiz urinishlar sanaladi (IP bo'yicha 20, hisob bo'yicha 5, 15 daqiqa). Xato xabari email yoki parol noto'g'riligini ajratmaydi.
- Brauzer sarlavhalari (`next.config.ts`): `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (HSTS ni hosting beradi, masalan Vercel).
- Haqiqiy ma'lumotga o'tishdan oldin: mock kirishni o'chiring, demo parollarni olib tashlang, `SESSION_SECRET` ni yangilang, parol hashini kuchli algoritmda saqlang.

## 8. Muhit o'zgaruvchilari

| Nomi                 | Maqsad                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `SESSION_SECRET`     | Sessiya imzosi (production'da majburiy, ≥ 32 belgi)                     |
| `MOCK_AUTH_ENABLED`  | `true` bo'lsa demo kirish ishlaydi (production'da faqat demo uchun)     |
| `SHOW_DEMO_ACCOUNTS` | `true` bo'lsa login sahifasida demo hisoblar ko'rsatiladi               |
| `ANTHROPIC_API_KEY`  | Bo'lsa AI chat haqiqiy Claude'dan javob oladi, bo'lmasa namunaviy rejim |
| `AI_MODEL`           | Ixtiyoriy model nomi (standart `claude-haiku-5-5`)                      |
| `ANTHROPIC_BASE_URL` | Ixtiyoriy (testlarda soxta server uchun)                                |

## 9. Tavsiya etilgan ish tartibi

1. Loyihani ishga tushiring, hamma bo'limlarni uchala rol bilan aylanib chiqing.
2. Bazani tanlang va `store.ts` o'rniga repository qatlamini yozing (jadvallar yuqorida).
3. Autentifikatsiyani almashtiring (`mock/users.ts`, `session.ts`), parol tiklashni haqiqiy pochta bilan ulang.
4. `service.ts`/`sections.ts` ni bazaga o'tkazing (imzolarni saqlab), E2E testlarni har qadamda ishga tushiring: ular ruxsatlar, vazifa aylanishi va API xatolarini tekshiradi.
5. Rate limit, deploy va monitoring (ko'p nusxada ishlash uchun markaziy limit).
6. `MOCK_AUTH_ENABLED`, `src/lib/mock/` va demo hisoblarni olib tashlang.

Savollar bo'lsa, kod izohlari (O'zbek tilida) va `docs/weekly/` dagi haftalik hisobotlar qarorlar tarixini tushuntiradi.
