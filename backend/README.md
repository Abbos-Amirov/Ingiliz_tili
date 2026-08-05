# Ingliz✦Learn — Backend

Koreys tili orqali ingliz tilini o'rganish ilovasining backend qismi: Node.js + Express + TypeScript + MongoDB (Mongoose).

So'z moslashtirish, gap tuzish (grammatik rol tizimi bilan), darslar bo'yicha guruhlash, spaced repetition (SRS), streak/statistika va AI yordamida kontent yaratishni ta'minlaydigan REST API.

> Bu loyihaning **backend** qismi. To'liq loyiha (frontend bilan birga) uchun: [Ingiliz_tili](https://github.com/Abbos-Amirov/Ingiliz_tili) repositoriyasiga qarang.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # keyin haqiqiy qiymatlarni kiriting
npm run seed            # bazani so'z/gap/admin hisob bilan to'ldiradi
npm run dev              # http://localhost:5051
```

## Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Tavsif |
|---|---|
| `PORT` | Server porti (standart: `5051`) |
| `MONGODB_URI` | MongoDB Atlas ulanish satri |
| `JWT_SECRET` | Token imzolash uchun tasodifiy uzun satr |
| `JWT_EXPIRES_IN` | Token amal qilish muddati (standart: `7d`) |
| `ENGLISH_AI_API_KEY` | Anthropic API kaliti — admin paneldagi AI yordamchilar (tarjima taklifi, gap grammatik rollarini avtomatik ajratish) uchun. `ANTHROPIC_API_KEY` ham fallback sifatida qabul qilinadi. |
| `CORS_ORIGIN` | Frontend manzili (vergul bilan bir nechtasi mumkin), standart `http://localhost:5050` |
| `NODE_ENV` | `development` / `production` |

## Admin hisob (seed skriptidan keyin)

- Email: `admin@ingiliztili.local`
- Parol: `Admin123!`

Birinchi kirishdan so'ng parolni almashtirish tavsiya etiladi.

## Skriptlar

- `npm run dev` — tsx watch orqali ishga tushirish (o'zgarishlarda avtomatik qayta yuklanadi)
- `npm run build` — TypeScript'ni `dist/`ga kompilyatsiya qilish
- `npm run start` — kompilyatsiya qilingan versiyani ishga tushirish
- `npm run seed` — bazani namuna so'z/gap/admin hisob bilan to'ldirish (mavjud so'z/gaplarni o'chirib qayta yaratadi)

## API qisqacha

Barcha yo'llar `/api` prefiksi bilan boshlanadi.

- `POST /auth/register`, `POST /auth/login`, `POST /auth/admin-login`, `GET /auth/me`
- `GET/POST/PUT/DELETE /words`, `POST /words/bulk-upload` (CSV)
- `GET/POST/PUT/DELETE /sentences`
- `GET /lessons`, `GET /lessons/next-number` (admin)
- `GET /srs/next-batch`, `POST /srs/review`, `GET /srs/difficult-words`, `POST /srs/recall-check`
- `GET /stats/me`, `POST /stats/daily-check-in`
- `POST /admin/ai-assist/translate`, `POST /admin/ai-assist/sentence-roles` (ikkalasi ham admin, AI yordamida)
- `GET /config/levels` — daraja bo'yicha grammatik formula/rol ro'yxati

## Texnologiyalar

Express, Mongoose, JWT (`jsonwebtoken` + `bcryptjs`), Zod (env validatsiyasi), Multer + csv-parse (CSV yuklash), `@anthropic-ai/sdk`.
