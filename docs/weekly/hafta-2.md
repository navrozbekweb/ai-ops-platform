# Hafta 2 hisobi

## Qilingan ishlar

- 21.11 Menyuni rolga qarab uch guruhga ajratdim: "Umumiy", "Ish", "Ma'muriyat" (`NAV_GROUPS_BY_ROLE`). Admin uchala guruhni, rahbar ikkitasini, xodim faqat o'z bo'limlarini ko'radi.
- 21.11 `Sidebar` ni yig'iladigan qildim: yig'ilgan holatda faqat ikonkalar, har birida `aria-label` va `title`. Holat `aiops_sidebar` cookie'sida saqlanadi, shuning uchun sahifa yangilanganda sakrash bo'lmaydi.
- 21.11 Joriy sahifani `aria-current="page"` bilan belgiladim, telefonda sidebar'ni `Drawer` qilib, havola bosilganda yopiladigan qildim.
- 21.11 `Header` yozdim: `Breadcrumbs`, qidiruv tugmasi, `NotificationsMenu` va `ProfileMenu`.
- 21.11 `CommandPalette` (Ctrl/Cmd+K) yaratdim: brauzerning `<dialog>` elementi ustida, sahifalar va amallar (mavzu, chiqish) bo'yicha qidiradi, faqat rolga ruxsat etilgan sahifalarni ko'rsatadi, strelka tugmalari va Enter ishlaydi.
- 21.11 Bildirishnomalar menyusini yozdim: o'qilmaganlar soni, bittasini yoki hammasini o'qilgan deb belgilash, nisbiy vaqt (`Intl.RelativeTimeFormat`, uch tilda).
- 21.11 Umumiy `Popover` komponentini yaratdim: Escape yopadi va fokusni tugmaga qaytaradi, tashqariga bosish yopadi, telefonda ekran kengligiga moslanadi.
- 21.11 "Asosiy kontentga o'tish" havolasini (skip link) qo'shdim.
- 21.11 `loading.tsx`, `error.tsx` ("Qayta urinish" tugmasi bilan) va `not-found.tsx` ni panel ichida ko'rsatadigan qildim.
- 21.11 Yangi matnlarni uch tilga tarjima qildim, kalit to'plamlari bir xilligini tekshirdim.
- 21.11 Navigatsiya va login limiti uchun 19 ta yangi E2E test yozdim (jami 39). Hammasi o'tdi.

## Muammolar

- Navigatsiya testlarini ketma-ket yurgizganda 10 ta test login sahifasida qolib ketdi.
- Next.js 16 da `error.tsx` odatdagi `reset` prop'ini bermadi.
- React compiler qoidasi (`react-hooks/refs`) `Popover` ichidagi `close` funksiyasini xato deb topdi.
- Testda "Menyu" nomi "Hisob menyusi" tugmasiga ham mos kelib, adashdi.

## Yechim

- Sabab 1-haftadagi limitda edi: u muvaffaqiyatli kirishlarni ham sanardi, bitta ofis IP'sidan ko'p xodim kirsa hamma bloklanardi. Endi faqat xato urinishlar sanaladi (IP bo'yicha 20, hisob bo'yicha 5), muvaffaqiyatli kirish hisoblagichni nolga qaytaradi. 3 ta yangi test qo'shdim.
- Loyiha ichidagi rasmiy hujjatdan topdim: Next.js 16 da `retry` prop'i keladi, shunga ko'ra yozdim.
- Render-prop'ni alohida `Slot` komponentida chaqirdim, `close` unga oddiy prop sifatida keladi.
- Locator'ni aniq nom (`exact: true`) bilan tuzatdim.

Batafsil hisobot (skrinshotlar bilan): [`reports/week-2.md`](../../reports/week-2.md)
