# Ingliz✦Learn — koreys tili orqali ingliz tilini o'rganish ilovasi

Monorepo: [`backend/`](backend/README.md) (Node + Express + TypeScript + MongoDB) va [`frontend/`](frontend/README.md) (Next.js + TypeScript + Tailwind CSS). Har bir qism alohida repo sifatida ham nashr etiladi — batafsil sozlash ko'rsatmalari uchun mos papkadagi README'ga qarang.

## Ishga tushirish

### 1. Backend

```bash
cd backend
npm install
npm run seed   # bazani so'z/gap/admin hisob bilan to'ldiradi
npm run dev    # http://localhost:5051
```

`backend/.env` MongoDB Atlas connection string va JWT_SECRET bilan tayyor bo'lishi kerak. `ENGLISH_AI_API_KEY` — admin paneldagi AI yordamchilari (tarjima taklifi, gap grammatik rollarini avtomatik ajratish) ishlashi uchun Anthropic API kaliti.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5050
```

### Admin kirish

Seed skripti quyidagi admin hisobni yaratadi:

- Email: `admin@ingiliztili.local`
- Parol: `Admin123!`

Birinchi kirishdan so'ng parolni almashtirish tavsiya etiladi. Admin panel: `/admin/login`.

## Xususiyatlar

- **So'z moslashtirish** (`/learn/match`) — animatsiyali juftlash, SRS (SM-2-lite) asosida navbatdagi so'zlar.
- **Gap tuzish** (`/learn/sentence`) — har so'z grammatik roliga qarab rangli, formula ko'rsatkichi, chalg'ituvchi so'zlar, qiyinlik darajalari.
- **Darslar** (`/lessons`) — so'z/gaplarni dars raqami (yoki bir nechta dars diapazoni, masalan "34-37") bo'yicha guruhlab mashq qilish.
- **Active Recall** (`/learn/recall`) — moslashtirish bosqichidan keyin erkin yozib javob berish testi.
- **Progress** (`/progress`) — streak, kunlik maqsad, qiyin so'zlar ro'yxati.
- **Admin panel** (`/admin`) — so'z/gap CRUD, CSV orqali ommaviy yuklash, AI yordamida tarjima va grammatik rol taklifi.
- **Ko'p tillilik** — interfeys o'zbek/ingliz/koreys tillarida.
- Talaffuz — brauzerning Web Speech API orqali (qo'shimcha xarajatsiz).

## Muhim eslatma

`ENGLISH_AI_API_KEY` haqiqiy qiymat bilan to'ldirilmaguncha, admin paneldagi AI tugmalari xato qaytaradi — bu kutilgan holat, boshqa hech narsaga ta'sir qilmaydi.
