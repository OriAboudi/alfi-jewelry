# ALFI — חנות תכשיטי כסף · React + Vite + Supabase

אתר חנות מלא (חזית + מערכת ניהול אדמין) הבנוי ב‑**React + Vite**, עם שכבת נתונים אחת
שמתחברת ל‑**Supabase** (מסד נתונים + הרשאות + אחסון תמונות — חלופה חינמית וקלה ל‑Firebase).

> **חשוב:** כל עריכת תוכן ותמונות נעשית **רק מתוך מערכת הניהול (אדמין)**. למבקרים רגילים
> אין שום אפשרות להעלות או לשנות תמונות — הם רואים את האתר בלבד.

---

## מה כולל האתר
- עמוד בית עם באנר, קטגוריות, מוצרים נבחרים ומקטע "הסיפור שלנו".
- קטלוג עם סינון לפי קטגוריה, עמוד מוצר, עגלה, תשלום, אישור הזמנה ומעקב משלוח.
- אזור אישי ללקוח עם היסטוריית הזמנות.
- **מערכת ניהול מלאה (אדמין):** הוספה/עריכה/מחיקה של מוצרים וקולקציות, העלאת תמונות,
  עריכת כל תוכן האתר (כותרות, טקסטים, באנר, דמי משלוח), ניהול הזמנות וצפייה במשתמשים.

---

## הרצה מהירה (ללא שרת)
ברירת המחדל היא מצב **מקומי** — הכל נשמר ב‑localStorage של הדפדפן, אפס הגדרות.

```bash
npm install
npm run dev
```

נפתח ב‑`http://localhost:5173`.

האתר עצמו אינו מציג שום כפתור התחברות/הרשמה ללקוחות — כל הזמנה היא הזמנת אורח.
הניהול נגיש רק דרך כתובת נסתרת, ראו סעיף "כניסת ניהול" למטה.

**כניסת אדמין לדוגמה (מצב מקומי בלבד):** `admin@alfi.co.il` / `alfi-admin` בכתובת `/portal-09340b71e2da`.

---

## חיבור ל‑Supabase (פרודקשן)

### 1. יצירת פרויקט
היכנסו ל‑[supabase.com](https://supabase.com) (חינמי), צרו פרויקט חדש.

### 2. הרצת הסכמה
ב‑Supabase: **SQL Editor → New query**, הדביקו את כל התוכן של `supabase/schema.sql`
והריצו. זה יוצר את כל הטבלאות, ההרשאות (RLS), נתוני הזרע, ו‑bucket האחסון לתמונות.

### 3. הגדרת משתני הסביבה
העתיקו את `.env.example` ל‑`.env` ומלאו (מתוך **Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_BUCKET=product-images
```

ברגע ששני המשתנים הראשונים מלאים — האתר עובר אוטומטית לעבוד מול הענן.

### 4. כניסת ניהול
אין כפתור התחברות באתר — ניהול נגיש רק בכתובת נסתרת שאינה מקושרת משום מקום:
`ADMIN_PATH` בקובץ `src/lib/adminPath.js` (כרגע `/portal-09340b71e2da`). כניסה לשם מציגה
טופס אימייל+סיסמה; אחרי התחברות מוצלחת (ורק אם `role='admin'` בטבלת `profiles`) נפתח הניהול.

חשבון האדמין נוצר ב‑Supabase Auth כרגיל; כדי להפוך משתמש קיים לאדמין הריצו ב‑SQL Editor
(מחליף הרשאות בעל גישת superuser, ולכן בטוח יותר מכל דרך זמינה מהאתר עצמו):

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

**שינוי הכתובת הנסתרת:** ערכו את `ADMIN_PATH` ב‑`src/lib/adminPath.js` ובנו מחדש (`npm run build`).

### 5. אחסון תמונות
ה‑bucket בשם `product-images` נוצר אוטומטית מהסכמה והוא ציבורי (קריאה לכולם).
העלאת תמונות מותרת **לאדמינים בלבד**. כשמעלים תמונה במערכת הניהול היא נשמרת בענן
ומקבלת קישור קבוע — אין יותר תלות בקבצים מקומיים.

---

## בנייה והעלאה לאוויר (Deploy)

```bash
npm run build      # יוצר תיקיית dist/
npm run preview    # תצוגה מקדימה של גרסת הפרודקשן
```

מעלים את `dist/` לכל שירות אחסון סטטי. הקלים והחינמיים:

- **Netlify / Vercel / Cloudflare Pages:** חברו את הריפו, הגדירו
  Build command: `npm run build`, Publish directory: `dist`,
  והוסיפו את משתני הסביבה (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  בהגדרות הפרויקט. זהו — האתר חי.

---

## מבנה הפרויקט
```
alfi-react/
├─ index.html                 כניסה ל‑Vite
├─ .env.example               תבנית משתני סביבה
├─ supabase/schema.sql        סכמת מסד הנתונים + אחסון + הרשאות
├─ public/floral-bg.jpg       רקע פרחוני
└─ src/
   ├─ main.jsx                איתחול React
   ├─ App.jsx                 ניתוב בין המסכים + חזית האתר
   ├─ index.css               התאמות פריסה ישנות (r-* breakpoints) לעמודים שטרם הועברו
   ├─ styles/                 ★ מערכת העיצוב — tokens.css (משתני צבע/ריווח/טיפוגרפיה/רדיוס),
   │                            base.css (איפוסים גלובליים), utilities.css (glass-card,
   │                            btn-primary, container, גריד מובייל‑first, sticky-mobile-bar)
   ├─ lib/
   │   ├─ store.js            ★ שכבת הנתונים — כל גישה למסד עוברת כאן
   │   ├─ css.js              עזר להמרת סגנון אינליין לאובייקט React
   │   ├─ format.js           עיצוב מחיר ותאריך
   │   └─ ui.js               עזרי תמונה/תצוגה
   ├─ context/StoreContext.jsx  מצב גלובלי (משתמש, עגלה, מוצרים, פעולות)
   ├─ components/             Header, Footer, HeroSlider, CardSlider, AdminImageField, קישוטים
   └─ screens/                כל המסכים (בית, קטלוג, מוצר, עגלה, admin/ — פאנל הניהול)
```

**נקודת ההחלפה היחידה:** `src/lib/store.js`. כל ה‑UI מדבר רק עם האובייקט `store`,
כך שמעבר בין מקומי לענן לא משנה אף שורת ממשק.

## עיצוב — טוקנים, סליידרים ומובייל‑first

הסגנון עבר מסגנונות אינליין חוזרים (`css()` string) למערכת טוקנים אמיתית ב‑
`src/styles/tokens.css` (צבע, ריווח, טיפוגרפיה נוזלית עם `clamp()`, רדיוס, צל) —
כל שינוי עתידי לפלטה נעשה במקום אחד. `utilities.css` מכיל מחלקות אמיתיות
(`glass-card`, `btn-primary`/`btn-secondary`, `container`, `grid-3`/`grid-4`)
במקום שכפול אותו מחרוזת סגנון בכל מסך. כל מדיה־קוורי חדש הוא מובייל‑first
(`min-width`), עם יעד מגע מינימלי 44px.

**סליידרים (עמוד הבית):**
- `HeroSlider` — הבאנר הראשי עובר אוטומטית בין `content.heroImages` (עד 5 תמונות,
  נערך בלשונית "תוכן האתר" באדמין). תמונה אחת = באנר קבוע, כמו קודם.
- `CardSlider` — מקטע "פורחים השבוע" הוא קרוסלה הניתנת לגלילה (מגע טבעי בנייד,
  חצים בדסקטופ) במקום רשת קבועה, ומציג עד 8 מוצרים במקום 4.

---

## סליקת אשראי — Takbull

Takbull הוא שער התשלום היחיד באתר. ההזמנה נוצרת בצד שרת (Supabase Edge Function),
שגם מחשבת מחדש את המחירים מה‑DB עצמו — לקוח לא יכול לשנות מחיר בדפדפן. פרטי כרטיס
אשראי **אף פעם לא** מגיעים לאתר או לשרת שלכם — הכל קורה בדף המאורח של Takbull.

**קבצים:**
- `supabase/functions/create-takbull-payment/` — יוצר את ההזמנה (סטטוס תשלום `pending`) ופותח דף תשלום של Takbull.
- `supabase/functions/takbull-ipn/` — Takbull קורא לכתובת הזו (IPN) כשהתשלום מסתיים; מאמת מול `ValidateNotification` ומסמן את ההזמנה `paid`.
- `supabase/functions/get-order/` — מאפשרת ללקוח לבדוק את סטטוס ההזמנה שלו אחרי חזרה מהתשלום (מוגן ע"י ה‑UUID הלא-ניחוש של ההזמנה, לא ע"י התחברות).
- `supabase/add-takbull-payments.sql` — מוסיף את העמודות `payment_method`/`takbull_uniq_id`.

**הגדרה (חד־פעמי):**

1. פנו לתמיכת Takbull (דרך [app.takbull.co.il](https://app.takbull.co.il)) וקבלו `API_Key`/`API_Secret`.
2. התקינו את [Supabase CLI](https://supabase.com/docs/guides/cli) וקשרו את הפרויקט:
   ```bash
   supabase login
   supabase link --project-ref <project-ref-מה‑URL-של-הפרויקט>
   ```
3. הגדירו את המפתחות כ‑secrets (לעולם לא בקוד):
   ```bash
   supabase secrets set TAKBULL_API_KEY=...
   supabase secrets set TAKBULL_API_SECRET=...
   ```
4. הריצו את המיגרציה `supabase/add-takbull-payments.sql` (SQL editor באתר Supabase).
5. פרסמו את הפונקציות. שימו לב ל‑`--no-verify-jwt` על כולן: הן נקראות מהדפדפן של
   אורח בלי משתמש מחובר (וה‑IPN נקרא ע"י Takbull בלי JWT בכלל), וה‑CORS preflight
   (`OPTIONS`) שהדפדפן שולח לא נושא כותרת `Authorization` בכלל — אם `verify_jwt` דלוק
   (ברירת המחדל), הוא ייחסם עוד לפני שהפונקציה מקבלת הזדמנות להחזיר את כותרות ה‑CORS,
   והדפדפן יציג שגיאת "blocked by CORS policy" מטעה (זו לא בעיית CORS אמיתית). ההגנה
   האמיתית היא חישוב המחיר מחדש בצד שרת בתוך הפונקציה, לא ה‑JWT gate:
   ```bash
   supabase functions deploy create-takbull-payment --no-verify-jwt
   supabase functions deploy takbull-ipn --no-verify-jwt
   supabase functions deploy get-order --no-verify-jwt
   ```

כתובת ה‑IPN נשלחת אוטומטית ל‑Takbull בכל בקשת תשלום (`<project-ref>.supabase.co/functions/v1/takbull-ipn`) —
אין צורך להגדיר אותה ידנית בפאנל שלהם.

עד שהצעדים האלה לא בוצעו, לחיצה על "שליחת ההזמנה" תיכשל — אבל בפועל השגיאה שתראו
בקונסול היא `blocked by CORS policy` ולא הודעת "פונקציה לא נמצאה" ברורה. אם אתם רואים
את זה: בדקו קודם כל ש‑`supabase link` בוצע ושהפונקציה אכן פרוסה (`supabase functions list`).

> **הערה:** המימוש הנוכחי תומך בתשלום בכרטיס אשראי דרך דף התשלום המאורח של Takbull
> (redirect flow). תשלום ב‑Bit (`PaymentMethodType=21`, זרימת deep-link ל‑app) לא
> מומש — דורש טיפול נפרד בצד לקוח (זיהוי מובייל + `window.open`) ואפשר להוסיף בהמשך.

## Apple Pay

Takbull תומכים ב‑Apple Pay דרך אימות דומיין סטנדרטי (כמו Stripe/Braintree וכו').

**קובץ:** `public/.well-known/apple-developer-merchantid-domain-association` —
הורד מפאנל הסוחר של Takbull (Settings → Credit Card Processing Settings → בחרו
טרמינל → Domain Verification), ולא לשנות את השם או התוכן שלו. Vite/Netlify מגישים
כל קובץ מ‑`public/` באותו נתיב בדיוק תחת `dist/`, כולל תיקיות עם נקודה כמו `.well-known`.
`public/_redirects` כולל כלל מפורש שמוציא את `/.well-known/*` מה‑SPA catch-all, כדי
שהקובץ יוגש כקובץ סטטי ולא יוחזר `index.html` במקומו.

**שלבים שנותרו (חד־פעמי, אחרי שהאתר עולה על דומיין אמיתי):**
1. פרסמו/עשו deploy מחדש לאתר ב‑Netlify כך שהקובץ יהיה חי בכתובת האמיתית.
2. בדקו בדפדפן ש‑`https://הדומיין-שלכם/.well-known/apple-developer-merchantid-domain-association`
   מציג את תוכן הקובץ (לא 404 ולא דף הבית).
3. בפאנל הסוחר של Takbull, הזינו את הדומיין (בפורמט `https://הדומיין-שלכם/`) ולחצו
   על כפתור אימות הדומיין.

## Google Pay

לא מצאנו תיעוד ל‑Google Pay אצל Takbull (ה‑API המתועד תומך רק בכרטיס אשראי
`PaymentMethodType=3` וב‑Bit `21`) — פנו לתמיכת Takbull אם זה נדרש.

## אישור הזמנה במייל

נשלח דרך [Resend](https://resend.com) מיד כשההזמנה מסומנת `paid` (בתוך `takbull-ipn`),
בדיוק פעם אחת גם אם ה‑IPN מגיע כמה פעמים.

**קבצים:** `supabase/functions/_shared/email.ts`.

**הגדרה (חד־פעמי):**
1. הרשמו ב‑[resend.com](https://resend.com) וקבלו API key.
2. `supabase secrets set RESEND_API_KEY=re_...`
3. (אופציונלי, לפני production אמיתי) אמתו דומיין משלכם ב‑Resend, ואז:
   `supabase secrets set ORDER_EMAIL_FROM="ALFI <orders@yourdomain.com>"`
   בלי זה, המיילים יישלחו מכתובת הבדיקה של Resend (`onboarding@resend.dev`).
4. הגדירו את כתובת האתר (בלי `/` בסוף) כדי שקישור "מעקב אחר ההזמנה" במייל יעבוד:
   `supabase secrets set SITE_URL=https://your-real-domain.com`

עד שה‑secrets לא מוגדרים, הזמנות ממשיכות לעבוד כרגיל — רק שליחת המייל (או קישור
המעקב בתוכה) מדולגים, עם אזהרה בלוגים של הפונקציה.

## מעקב הזמנה בקישור קבוע

כל מייל אישור הזמנה כולל קישור `https://האתר-שלכם/?order=<מזהה>` שהלקוח יכול לפתוח
בכל זמן, מכל מכשיר, כדי לראות את הסטטוס העדכני, פרטי הלקוח והפריטים — בלי צורך
בהתחברות. הקישור מוגן ע"י ה‑UUID הלא-ניחוש של ההזמנה (אותו מנגנון כמו `get-order`),
ומציג תמיד את הנתונים האמיתיים מה‑DB, כולל שינויי סטטוס שהאדמין ביצע.

**קבצים:** `src/screens/Status.jsx`, `supabase/functions/get-order/`.

## ניהול הזמנות בפאנל האדמין

בלשונית "הזמנות", כפתור "פרטים" בכל שורה פותח חלון עם כל הפרטים — לקוח, כתובת,
פריטים, סכומים, סטטוס תשלום וציר זמן סטטוסים — וכולל את בורר הסטטוס כדי לעדכן
אותו במקום אחד. שינוי סטטוס עובר תמיד דרך ה‑Edge Function `update-order-status`
(לא כתיבה ישירה לטבלה), ששולחת ללקוח מייל עדכון (Resend) ומוסיפה שורה לטבלת
`order_status_history` — כך שינוי סטטוס אף פעם לא "שקט". הלקוח רואה את אותו
עדכון מיד בקישור המעקב שלו.

הלשונית "הזמנות" ולשונית "מוצרים" מסוננות/מדופדפות בצד שרת (חיפוש, סינון, עמודים)
במקום לטעון את כל הטבלה לדפדפן — ראו `src/lib/store.js` (`orders.listAll(params)`,
`products.list(params)`). לשונית "סקירה כללית" (Dashboard) מציגה הכנסות, מספר
הזמנות, פילוח לפי סטטוס, מוצרים נמכרים ביותר והתראות מלאי נמוך — מחושבים בפונקציות
Postgres (`supabase/add-order-stats-rpc.sql`) כדי שלא יהיה צורך לטעון כל ההזמנות.

**קבצי מפתח:** `supabase/functions/update-order-status/`, `supabase/add-order-status-notifications.sql`,
`supabase/add-order-stats-rpc.sql`, `supabase/add-admin-indexes.sql`, `src/screens/admin/*`.

פרסום הפונקציה החדשה (אותו `--no-verify-jwt` כמו כל הפונקציות האחרות, ואותה הגנה
בפועל דרך `isAdminRequest` בקוד):
```bash
supabase functions deploy update-order-status --no-verify-jwt
```

## מלאי (Inventory)

לכל מוצר יש שדה "מלאי" שהאדמין קובע בעריכת המוצר. כשהמלאי אוזל:
- בעמוד המוצר ובעגלה מוצג "אזל במלאי" והוספה/הגדלת כמות חסומות.
- בשרת (`create-takbull-payment`) הכמות המבוקשת נבדקת שוב מול המלאי האמיתי לפני
  יצירת ההזמנה — לקוח לא יכול לעקוף את הבדיקה מהדפדפן.
- המלאי יורד אוטומטית (בפונקציית Postgres אטומית, `decrement_stock`) רק כשהתשלום
  אושר בפועל דרך ה‑IPN — לא בעת יצירת ההזמנה — כדי שעגלות ננטשות לא ינעלו מלאי.

**קבצים:** `supabase/add-inventory.sql`.

## בדיקות תשלום בסכום חופשי (אדמין)

בלשונית "בדיקות תשלום" בפאנל הניהול, מנהל מחובר יכול ליצור הזמנת בדיקה בסכום חופשי
(לא לפי מחירי המוצרים) ולפתוח את דף התשלום האמיתי. שימושי כי כל המוצרים באתר יקרים
ממגבלת ה‑₪5 של סביבת הבדיקות של Takbull. ה‑Edge Functions מוודאות בעצמן שהמבקש הוא
אכן מנהל מחובר (`_shared/adminAuth.ts`) — לקוח רגיל ששולח `testAmount` מתעלמים ממנו
לחלוטין וחוזרים לזרימת העגלה הרגילה. הזמנות בדיקה מסומנות `is_test = true` ומופיעות
בלשונית "הזמנות" עם תג TEST כדי שלא יתערבבו בדוחות הכנסה אמיתיים.
