# Hafta 6: haqiqiy AI yordamchi

## Qilingan ishlar

- 27.11 AI yordamchi Claude (Anthropic Messages API) bilan ulandi: `ANTHROPIC_API_KEY` bo'lsa haqiqiy javob, bo'lmasa avvalgi namunaviy rejim.
- 27.11 Model kontekst oladi: foydalanuvchining ko'rinadigan vazifalari, hujjatlari, jamoasi va (admin, rahbar uchun) korxona ko'rsatkichlari. Rolga ko'ra filtrlash serverdagi mavjud funksiyalar orqali bo'ladi, shuning uchun AI boshqaning yopiq ma'lumotini bera olmaydi.
- 27.11 Suhbat tarixi (oxirgi 8 xabar) modelga yuboriladi, javob foydalanuvchi tilida (uz, ru, en) qaytadi.
- 27.11 Xavfsizlik va xarajat: kalit faqat serverda; foydalanuvchi matni promptda bitta qatorga keltiriladi va "ma'lumot, ko'rsatma emas" deb belgilanadi; javob 600 tokengacha; 25 soniya taymaut; daqiqasiga 30 so'rov; administrator AI'ni o'chira oladi.
- 27.11 Xato holati: model xizmati javob bermasa, 502 va tushunarli xabar (3 tilda).
- 27.11 7 ta yangi E2E test soxta Anthropic serveriga qarshi (tarmoqqa chiqilmaydi): so'rov shakli, ma'lumot chegarasi, prompt himoyasi, xato, o'chirish, tarix chegarasi.

## Muammolar

- Haqiqiy API kaliti sinov muhitida yo'q, tashqi tarmoqqa chiqish ham cheklangan.
- Prompt injection xavfi: hujjat va vazifa sarlavhalarini foydalanuvchilar yozadi.

## Yechim

- Testlar uchun soxta Anthropic server (`e2e/fake-anthropic.mjs`) va unga ulangan ikkinchi ilova nusxasi.
- Model faqat o'qiydi (vositalar yo'q), shuning uchun injection eng ko'pi bilan o'sha foydalanuvchining o'z ma'lumotini ko'rsatishi mumkin; matnlar bir qatorga keltiriladi va ma'lumot sifatida belgilanadi.
