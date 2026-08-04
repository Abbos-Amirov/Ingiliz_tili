# Ingliz✦Learn — koreys tili orqali ingliz tilini o'rganish ilovasi

Monorepo: `backend/` (Node + Express + TypeScript + MongoDB) va `frontend/` (Next.js + TypeScript + Tailwind CSS).

## Ishga tushirish

### 1. Backend

```bash
cd backend
npm install
npm run seed   # bazani ~28 so'z, ~12 gap va admin hisob bilan to'ldiradi
npm run dev    # http://localhost:4000
```

`backend/.env` MongoDB Atlas connection string va JWT_SECRET bilan tayyor. `ANTHROPIC_API_KEY` hozircha placeholder — AI auto-tarjima yordamchisi ishlashi uchun haqiqiy Anthropic API kalitini shu faylga qo'ying.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000 (band bo'lsa avtomatik 3001 va h.k.)
```

### Admin kirish

Seed skripti quyidagi admin hisobni yaratadi:

- Email: `admin@ingiliztili.local`
- Parol: `Admin123!`

Birinchi kirishdan so'ng parolni almashtirish tavsiya etiladi. Admin panel: `/admin/login`.

## Xususiyatlar

- **So'z moslashtirish** (`/learn/match`) — animatsiyali juftlash, SRS (SM-2-lite) asosida navbatdagi so'zlar.
- **Gap tuzish** (`/learn/sentence`) — chalg'ituvchi so'zlar, qiyinlik darajalari.
- **Active Recall** (`/learn/recall`) — moslashtirish bosqichidan keyin erkin yozib javob berish testi.
- **Progress** (`/progress`) — streak, kunlik maqsad, qiyin so'zlar ro'yxati.
- **Admin panel** (`/admin`) — so'z/gap CRUD, CSV orqali ommaviy yuklash, AI auto-tarjima yordamchisi.
- Talaffuz — brauzerning Web Speech API orqali (qo'shimcha xarajatsiz).

## Muhim eslatma

`ANTHROPIC_API_KEY` haqiqiy qiymat bilan almashtirilmaguncha, admin paneldagi "✨ AI bilan taklif olish" tugmasi xato qaytaradi — bu kutilgan holat, boshqa hech narsaga ta'sir qilmaydi.
