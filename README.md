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

### Docker orqali (ikkalasini birga)

```bash
docker compose up -d --build
```

Bu `backend/.env`dagi qiymatlarni o'qib backend'ni **http://localhost:5051**da, frontend'ni **http://localhost:5050**da ishga tushiradi (ikkalasi ham konteynerlarda). To'xtatish uchun: `docker compose down`. Loglarni ko'rish: `docker compose logs -f`. Bazani to'ldirish konteyner ichida: `docker compose exec backend node dist/scripts/seed.js`.

Agar frontend haqiqiy (localhost bo'lmagan) backend manziliga ulanishi kerak bo'lsa, build vaqtida uzating (Next.js `NEXT_PUBLIC_*` o'zgaruvchilarni build paytida ichiga joylab qo'yadi):

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.sizning-domeningiz.com/api docker compose up -d --build
```

### Android ilova (APK)

Frontend `Capacitor` bilan Android ilova sifatida ham o'raladi (`frontend/android/`) — ilova ichida haqiqiy sahifalar emas, joriy production sayti (`capacitor.config.ts`dagi `server.url`) WebView'da ochiladi, shuning uchun sayt yangilanishi bilan ilova ham avtomatik yangilanadi (APK'ni qayta build qilish shart emas).

```bash
cd frontend
npx cap sync android
cd android
JAVA_HOME="$(brew --prefix openjdk@21)" ./gradlew assembleDebug
```

APK: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`. Bu debug-imzoli APK — telefonga to'g'ridan-to'g'ri o'rnatish (sideload) uchun yaroqli, lekin Google Play'ga yuklash uchun emas.

**Play Store'ga chiqarish uchun qo'shimcha qadamlar kerak:**
1. Domen + HTTPS sozlash, so'ng `capacitor.config.ts`dagi `server.url`ni `https://...`ga o'zgartirish va `network_security_config.xml`ni olib tashlash (hozir domen yo'qligi uchun serverning IP-manziliga oddiy HTTP orqali ulanadi).
2. O'z release-keystore'ingizni yaratib (`keytool -genkeypair ...`), `assembleRelease` bilan imzolangan `.aab` fayl chiqarish (Play Console faqat App Bundle qabul qiladi, oddiy APK emas).
3. Google Play Developer akkaunt ($25, bir martalik).

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
