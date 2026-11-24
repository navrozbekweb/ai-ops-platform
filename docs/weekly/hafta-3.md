# Hafta 3 hisobi

## Qilingan ishlar

- 22.11 `Modal` yozdim: brauzerning `<dialog>` elementi ustida, fokus ichkarida qoladi, Esc va fon bosish yopadi, yopilganda fokus ochgan tugmaga qaytadi.
- 22.11 `ConfirmDialog` yaratdim (o'chirish kabi xavfli amallar uchun, fokus xavfsiz tugmada).
- 22.11 `DataTable` yozdim: qidiruv, ustun bo'yicha saralash (`aria-sort`), sahifalash, filtr uchun joy, bo'sh va yuklanish holati. Ikkinchi darajali ustunlar telefonda yashiriladi.
- 22.11 Forma maydonlari (`fields.tsx`), `Badge`, `EmptyState`, `Toast` va `PageHeader` komponentlarini yozdim.
- 22.11 "Foydalanuvchilar" sahifasini (faqat admin) yaratdim: qo'shish, tahrirlash, bloklash va qayta faollashtirish, o'chirish, rol bo'yicha filtr.
- 22.11 "Vazifalar" sahifasini yozdim: xodim o'z vazifalarining holatini o'zgartiradi va tekshiruvga yuboradi, rahbar o'z jamoasiga tayinlaydi, admin hammasini ko'radi.
- 22.11 Rahbar uchun "Tasdiqlash" (tasdiqlash yoki sabab yozib qaytarish) va "Mening jamoam" sahifalarini yaratdim.
- 22.11 Mock API yozdim: `/api/users` va `/api/tasks`. Har so'rovda sessiyadan foydalanuvchi olinadi va ruxsat serverda hozirgi holat bo'yicha tekshiriladi (`401`, `403`, `400`, `413`).
- 22.11 Biznes qoidalarini serverga qo'ydim: rahbar xodim qo'sha olmaydi va faqat o'z jamoasiga vazifa tayinlaydi, xodim o'z ishini o'zi tasdiqlay olmaydi, admin o'zini bloklay, pastlata va o'chira olmaydi, qaytarishda sabab majburiy.
- 22.11 Bloklangan yoki o'chirilgan foydalanuvchining sessiyasini tugatadigan qildim (`session-expired`).
- 22.11 `npm run check:i18n` skriptini yozdim: uch tilda kalitlar to'liqligi va kodda ishlatilgan har bir kalit mavjudligini tekshiradi (315 kalit).
- 22.11 35 ta yangi E2E test yozdim (jami 74): API ruxsatlari, vazifa aylanishi uch rol bilan, jadval, modal klaviaturasi, bloklangan sessiya. Hammasi o'tdi.

## Muammolar

- Bloklangan foydalanuvchi yaroqli cookie bilan 8 soat kira olardi.
- Sanalar "2026 M11 21" ko'rinishida chiqdi.
- Telefonda breadcrumb matni bir-biriga o'tib ketdi.
- Telefonda jadval qatorlari juda baland bo'lib ketdi.
- Server komponentlar va route handler'lar ma'lumot omborining alohida nusxalarini olishi mumkin edi.

## Yechim

- Har so'rovda hisob holatini tekshirib, sessiyani tugatdim va cookie'ni tozaladim, test qo'shdim.
- Brauzerning `uz` uchun sana qoliplari ishonchsiz, shuning uchun sanani hamma tilda `kun.oy.yil` formatiga o'tkazdim.
- Qisqartiriladigan elementni `block` qildim, telefonda faqat joriy bo'lim ko'rsatiladi.
- Amal tugmalarini bir qatorda ushlab, jadvalni o'z ichida gorizontal siljiydigan qildim.
- Ombor holatini `globalThis` ga oldim, ikkala tomon bitta nusxani ko'radi.

Batafsil hisobot (skrinshotlar bilan): [`reports/week-3.md`](../../reports/week-3.md)
