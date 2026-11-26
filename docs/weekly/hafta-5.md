# Hafta 5: qolgan bo'limlar

## Qilingan ishlar

- 26.11 Profil: ismni tahrirlash va joriy parolni tekshirib almashtirish (Zod + React Hook Form, serverda ham tekshiriladi, urinishlar cheklangan).
- 26.11 Hujjatlar: jadval, qidiruv, tur bo'yicha filtr, qo'shish va o'chirish. Ko'rinish qoidasi: xodim o'zining va umumiy hujjatlarni, rahbar jamoasinikini ham, admin hammasini ko'radi.
- 26.11 AI yordamchi: chat oynasi (`role="log"`, tezkor savollar, Enter bilan yuborish). Javoblar foydalanuvchining haqiqiy ma'lumotlaridan tuziladi va tanlangan tilda qaytadi.
- 26.11 Korxona tahlili (admin, rahbar): KPI kartalari, holat va bo'limlar bo'yicha chiziqli grafiklar, xodimlar yuklamasi jadvali.
- 26.11 Audit jurnali (admin): foydalanuvchi, vazifa, hujjat, profil va sozlamalardagi amallar avtomatik yoziladi.
- 26.11 Tizim sozlamalari (admin): kompaniya nomi, AI yordamchini yoqish/o'chirish, email bildirishnomalari.
- 26.11 Rollar va huquqlar: har rol uchun bo'limlar matritsasi, `roles.ts` dan hisoblanadi.
- 26.11 14 ta yangi E2E test; jami 121 ta test, hammasi o'tdi (axe tekshiruvi yangi sahifalarni ham qamraydi).

## Muammolar

- Server komponentda Ant Design ikonkasi build'ni to'xtatdi (`createContext is not a function`).
- Parol almashtirish demo hisoblar xotirasida saqlanadi: server qayta ishga tushsa, eski parol qaytadi.

## Yechim

- `EmptyState` klient komponentga aylantirildi, rollar jadvalida inline SVG ishlatildi.
- Bu mock bosqichining cheklovi; haqiqiy backendda `changePassword` API chaqiruviga almashtiriladi.
