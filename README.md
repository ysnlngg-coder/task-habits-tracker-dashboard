# Daily Habit Tracker: دليل الملفات

كل شيء صار في ملفات صغيرة بأسماء واضحة. في أول كل ملف تعليق يشرح **ماذا يفعل** و**متى تعدّله**.
لا تحتاج npm ولا بناء: عدّل الملف واحفظه ثم حدّث الصفحة (Ctrl+F5).

## هيكل المجلد

```
habit-tracker/
├─ index.html            الهيكل فقط (قصير): يحمّل التصميم والكود بالترتيب
├─ config.js             رابط Supabase والمفتاح (تلصقهما مرة واحدة)
├─ css/
│  ├─ app.css            الشكل الأساسي: الألوان، البطاقات، القوائم، الأزرار
│  └─ extras.css         كل ما أُضيف لاحقاً (مقسّم بعناوين: الدخول، الأدمن، الأخبار، المؤقت…)
├─ js/
│  ├─ boot/              ما يعمل قبل وأثناء تسجيل الدخول
│  │   00-utils          دالة مساعدة صغيرة
│  │   01-supabase       الاتصال بـ Supabase
│  │   02-sound-effects  محرك الأصوات (النقر، التنبيه، النجاح…)
│  │   03-login-screen   شاشات الدخول والتسجيل
│  │   04-dialogs        نافذة التأكيد (حذف مستخدم…)
│  │   05-admin-panel    لوحة الأدمن + نشر الأخبار
│  │   06-top-bar        أيقونات أعلى اليمين: الأخبار والمساعد الذكي
│  │   07-cloud-stats    أرقام النشاط التي تظهر للأدمن
│  │   08-session        تسلسل البدء: الدخول ← الموافقة ← تحميل بياناتك ← تشغيل التراكر
│  └─ app/               التراكر نفسه (يُحمَّل بعد تسجيل الدخول)
│      01-core            البيانات الافتراضية، الحفظ والتحميل
│      02-timer-effects   المؤقت والحركات الصغيرة
│      03-screens         الشاشات: اليوم، العادات، Focus، النافذة المنبثقة، اللوحة اليمنى
│      04-youtube         روابط YouTube
│      05-music-engine    محرك الموسيقى والأصوات الجاهزة
│      06-music-screen    شاشة الموسيقى
│      07-limits          كل الحدود (غيّر رقماً لتغيّر حداً)
│      08-playlists       قوائم التشغيل
│      09-motivation      السلسلة، XP، المستوى، "I don't feel like it"
│      10-background-effects  الخلفية قوس قزح والتفاعل مع الموسيقى
│      11-sound-settings  إعدادات أصوات الواجهة
│      12-main            النقرات، الكتابة، أول رسم (يبقى الأخير)
├─ sql/                  ملفات قاعدة البيانات (انظر الترتيب أدناه)
├─ ai-assistant/index.ts كود المساعد الذكي (يُنشر في Supabase Edge Functions)
├─ supabase-functions/send-email/index.ts  رسائل البريد الخاصة بالتراكر (رمز استعادة كلمة المرور…)
└─ backup/               النسخة القديمة في ملف واحد، للرجوع إليها عند الحاجة
```

## أريد أن أغيّر… فأين؟

| أريد تغيير | الملف |
|---|---|
| الألوان الأساسية (الخلفية، البطاقات) | `css/app.css` أعلى الملف (`:root` والثيم الفاتح) |
| لون التمييز الافتراضي | `js/app/01-core.js` ← `DEF` ← `accent` |
| العادات والأهداف والأسطر التحفيزية الافتراضية لأي حساب جديد | `js/app/01-core.js` ← `DEF` |
| نصوص شاشة اليوم أو العادات أو Focus | `js/app/03-screens.js` |
| أي حد (قوائم التشغيل، حجم الملف، عدد العناصر) | `js/app/07-limits.js` ← `LIM` |
| قواعد XP والمستوى والرسائل التشجيعية | `js/app/09-motivation.js` |
| سرعة قوس قزح وقوة التفاعل مع الموسيقى | `js/app/10-background-effects.js` |
| الأصوات القصيرة (شكلها وأي زر يصدرها) | `js/boot/02-sound-effects.js` |
| نصوص الدخول والتسجيل | `js/boot/03-login-screen.js` ← `SUB` |
| ما يراه الأدمن في قائمة الناس | `js/boot/05-admin-panel.js` |
| رسائل المساعد الذكي وأزراره السريعة | `js/boot/06-top-bar.js` |
| شخصية المساعد وحدوده ونموذجه | `ai-assistant/index.ts` ← `SYSTEM` و`MODEL` |
| تصميم ونص رسائل البريد (رمز الاستعادة، التأكيد، الدعوة) | `supabase-functions/send-email/index.ts` ← `layout` و`buildMail` |
| شاشة إدخال رمز الاستعادة | `js/boot/08-session.js` (`mode === 'code'`) و`css/extras.css` (آخر الملف) |
| شكل شاشة الدخول أو لوحة الأدمن أو المؤقت | `css/extras.css` (ابحث عن عنوان القسم) |
| رابط Supabase والمفتاح | `config.js` |

ضع ملف `config.js` بجوار `index.html`، واجعله يعرّف الإعدادات بهذا الشكل باستخدام رابط مشروعك ومفتاح `anon/public` من Supabase:

```js
window.HT_CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  key: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
```

## ملفات SQL (تُشغَّل في Supabase ← SQL Editor، كلٌّ مرة واحدة)

1. `setup.sql` ← الجداول الأساسية والخصوصية
2. `setup_admin.sql` ← الحسابات والموافقة والأدمن
3. `setup_v3.sql` ← فحص الإيميل وحماية التسجيل
4. `setup_v4.sql` ← الزيارات والحذف النهائي
5. `setup_v5.sql` ← الأخبار وحدود المساعد
6. `setup_v7.sql` ← حدود الحجم والتخزين
7. `revert_v6.sql` ← **اختياري**: يزيل النقاط والمتصدرين لو كانت مثبتة

## رسائل البريد الخاصة (نسيت كلمة المرور بالرمز)
بدل رسالة Supabase الافتراضية، تُرسل رسالة بتصميم التراكر فيها **رمز من 6 أرقام**. الخطوات (مرة واحدة):

1. أنشئ حساباً في Resend واربط دومينك (للإرسال لأي إيميل لا لإيميلك فقط)، وخذ `RESEND_API_KEY`.
2. انشر الدالة: ضع مجلد `supabase-functions/send-email` داخل `supabase/functions/` في مشروعك ثم:
   `supabase functions deploy send-email --no-verify-jwt`
3. في Supabase ← Authentication ← Hooks أنشئ **Send Email hook** من نوع HTTPS والصق رابط الدالة، وانسخ السر الذي يظهر (`v1,whsec_...`).
4. أضف الأسرار:
   `supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..." RESEND_API_KEY="re_..." MAIL_FROM="Habit Tracker <no-reply@yourdomain.com>"`
5. في إعدادات Auth لمزوّد Email: اجعل طول الرمز **6** ومدة الصلاحية **600 ثانية** (10 دقائق) لتطابق النص في الرسالة والشاشة.

ملاحظة: الـ hook يشمل كل رسائل الـ Auth، لذلك الدالة تتعامل أيضاً مع التأكيد والدعوة بنفس التصميم. إن لم تفعّل الـ hook يبقى كل شيء يعمل برسالة Supabase، لكن شاشة الرمز لن تجد رمزاً في الرسالة.

## الرفع على الاستضافة
ارفع **المجلد كله** (`index.html` و`config.js` ومجلدي `css` و`js`)، وليس `index.html` وحده.
مجلدات `sql` و`backup` و`ai-assistant` لا تحتاج رفعاً.

## نصيحة للتعديل
- عدّل ملفاً واحداً في كل مرة، ثم حدّث الصفحة وجرّب.
- لو ظهرت شاشة حمراء مكتوب فيها `Startup error` فاسم الملف الذي فيه المشكلة مذكور في الرسالة.
- لا تغيّر ترتيب ملفات `js/app` ولا ترتيب أقسام `css/extras.css`، فالترتيب مقصود.

## if you forget your habits you can restore him:
open the tracker with you account click on keyboard "F12", then go to 'console' and write this codes below:
1. allow pasting
2. S.habits = DEF().habits; save(); render();