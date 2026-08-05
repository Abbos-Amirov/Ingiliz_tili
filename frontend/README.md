# Ingliz✦Learn — Frontend

Koreys tili orqali ingliz tilini o'rganish ilovasining frontend qismi: Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion.

So'z moslashtirish, gap tuzish (rangli grammatik rollar bilan), darslar bo'yicha o'rganish, spaced repetition, streak/progress va admin panel — barchasi uz/en/ko tillarida.

> Bu loyihaning **frontend** qismi. To'liq loyiha (backend bilan birga) uchun: [Ingiliz_tili](https://github.com/Abbos-Amirov/Ingiliz_tili) repositoriyasiga qarang.

## Ishga tushirish

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL backend manzilini ko'rsatadi
npm run dev                          # http://localhost:5050
```

Backend alohida ishga tushirilishi kerak (standart: `http://localhost:5051`) — ko'rsatmalar backend reposida.

## Muhit o'zgaruvchisi (`.env.local`)

| O'zgaruvchi | Tavsif |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API manzili, masalan `http://localhost:5051/api` |

## Sahifalar

- `/` — bosh sahifa
- `/login`, `/register` — kirish/ro'yxatdan o'tish
- `/learn/match` — So'z moslashtirish (SRS asosida)
- `/learn/sentence` — Gap tuzish (grammatik rol rang kodlash, formula ko'rsatkichi bilan)
- `/learn/recall` — Active Recall testi
- `/lessons`, `/lessons/practice`, `/all-words` — darslar bo'yicha yoki umumiy mashq
- `/progress` — streak va statistikalar
- `/admin/*` — so'z/gap CRUD, CSV yuklash, AI yordamchilar (parol bilan himoyalangan)

## Admin kirish

Backendda `npm run seed` ishga tushirilgan bo'lsa:

- Email: `admin@ingiliztili.local`
- Parol: `Admin123!`

## Skriptlar

- `npm run dev` — Turbopack bilan development server (`http://localhost:5050`)
- `npm run build` — production build
- `npm run start` — production serverni ishga tushirish
- `npm run lint` — ESLint

## Texnologiyalar

Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Framer Motion, Zustand (auth/locale/session state, `persist` bilan), brauzerning Web Speech API'si (talaffuz, qo'shimcha xarajatsiz).
