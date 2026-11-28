# Hafta 7: hujjatlarga fayl yuklash

## Qilingan ishlar

- 28.11 Hujjat qo'shishda ixtiyoriy fayl biriktirish mumkin (PDF, Word, Excel, PowerPoint, PNG/JPG, TXT, CSV; 2 MB gacha). Jadvalda fayl nomi va hajmi ko'rinadi, "Yuklab olish" havolasi chiqadi.
- 28.11 Yuklab olish `GET /api/docs/[id]/file`: ko'rish huquqi hujjatniki bilan bir xil (admin hammasini, rahbar jamoa va umumiylarni, xodim o'zinikini va umumiylarni). Ruxsati yo'q foydalanuvchiga 404, kirmaganga 401.
- 28.11 Yuklab olish audit jurnaliga yoziladi (`doc_download`), hujjat o'chirilganda fayl ham o'chadi.
- 28.11 Forma brauzerda ham turi va hajmini tekshiradi (tez xabar uchun), asosiy tekshiruv serverda.
- 28.11 Yangi xato kodlari 3 tilda: `fileTooLarge` (413), `fileType` (415), `storageFull` (507).
- 28.11 6 ta yangi E2E test: yuklash va bayt-bayt yuklab olish, ruxsatlar, noto'g'ri tur / katta / soxta fayl, nom tozalash, faylsiz eski so'rov, interfeys.

## Xavfsizlik qarorlari

- Kengaytma ro'yxati (allowlist): HTML, SVG, JS, EXE va boshqalar qabul qilinmaydi.
- Mijoz yuborgan `Content-Type`ga ishonilmaydi: tur kengaytmadan olinadi, ustiga faylning boshidagi "sehrli baytlar" tekshiriladi (nomi o'zgartirilgan fayl rad etiladi).
- Fayl nomidan yo'l belgilari (`../`), qo'shtirnoq va boshqaruv belgilari olib tashlanadi, uzunligi 120 belgigacha.
- Yuklab olish javobida `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, `Cache-Control: private, no-store`: fayl brauzerda ochilib skript ishlata olmaydi.
- Daqiqasiga 20 ta yuklash, butun ombor 50 MB bilan cheklangan.

## Muammolar

- Ma'lumotlar bazasi hozircha xotirada, shuning uchun fayllar ham xotirada: server qayta ishga tushsa yoki Vercel boshqa instansiyaga o'tkazsa, fayllar yo'qoladi.
- Vercel serverless so'rov hajmi taxminan 4,5 MB bilan cheklangan, shuning uchun chegara 2 MB.

## Yechim

- Fayl baytlari hujjat yozuvidan ajratilgan (`src/lib/data/files.ts`): yozuvda faqat nom, hajm va tur. Haqiqiy backendda faqat shu fayl obyekt omboriga (S3, Vercel Blob va h.k.) almashtiriladi.
- Faylsiz hujjat oldingi JSON so'rov bilan yaratiladi, fayl bilan `multipart/form-data` ishlatiladi.
