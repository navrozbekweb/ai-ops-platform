# Hafta 4 hisobi

## Qilingan ishlar

- 22.11 `@axe-core/playwright` ni qo'shib, qulaylik testlarini yozdim (`e2e/a11y.spec.ts`): uch rolning barcha sahifalari Light va Dark rejimda, ochiq sahifalar uch tilda, modal, bildirishnomalar va qidiruv oynasi. Qoidalar: WCAG 2.0/2.1/2.2 A va AA, jumladan rang kontrasti va bosish maydoni o'lchami.
- 22.11 Responsive testlarini yozdim (`e2e/responsive.spec.ts`): 390, 768 va 1440 px da har rol uchun hamma sahifada gorizontal scroll yo'qligi, yon panel va menyu tugmasi, sarlavha tugmalari o'lchami, modal ekranga sig'ishi.
- 22.11 `DataTable` ga `mobileInline` xususiyatini qo'shdim: telefonda amal tugmalari birinchi ustun ichida, matn tagida ko'rsatiladi. Foydalanuvchilar, Vazifalar, Tasdiqlash va Jamoa jadvallarida qo'lladim.
- 22.11 Axe topgan to'rtta xatoni tuzatdim: qidiruv tugmasi nomi, profil tugmasidagi bosh harflar, "Blokdan chiqarish" tugmasi yorlig'i, jadval sarlavhasidagi saralash tugmasi o'lchami.
- 22.11 Tarjimalarni qayta tekshirdim: har uch tilda 315 kalit, kodda ishlatilgan hammasi mavjud.
- 22.11 README'ni va haftalik hisobotlarni (`reports/` va `docs/weekly/`) yangiladim.
- 22.11 Yakuniy tekshiruv: lint, typecheck, build va 107 ta E2E testning hammasi o'tdi.

## Muammolar

- Qidiruv tugmasida "Qidirish Ctrl K" ko'rinar, lekin ekran o'qish dasturi faqat `aria-label` ni o'qirdi (WCAG 2.5.3).
- Profil tugmasidagi bosh harflar ("SR") tugma nomiga kirmasdi.
- "Faollashtirish" tugmasining nomi "Blokdan chiqarish: Ism" edi (uch tilda ham).
- Jadval sarlavhasidagi saralash tugmasi 20 px balandlikda edi (talab 24 px).
- Telefonda xodim vazifa holatini o'zgartirish uchun jadvalni yon tomonga surishi kerak edi.
- Ochiq bildirishnoma paneli ostidagi sahifa qismini skanerlaganda "yopilgan element" xatosi chiqdi.

## Yechim

- `aria-label` ni olib tashlab, matnni tugmaning o'z mazmuni qildim (telefonda `sr-only`), `Ctrl K` esa `aria-keyshortcuts` orqali beriladi.
- Bosh harflarni CSS orqali chizdim, tugma nomi "Hisob menyusi" bo'lib qoldi.
- Ko'rinadigan matnni nomga moslab, "Blokdan chiqarish" / "Разблокировать" / "Unblock" qildim.
- Saralash tugmasiga `min-h-7` berdim.
- Amallarni telefonda qator ichiga ko'chirdim (`mobileInline`), test bilan.
- Bu test artefakti edi: overlay testlarini faqat o'sha overlay'ning o'zini skanerlaydigan qildim.
