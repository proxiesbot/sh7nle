# دليل رفع Sh7nle على Hostinger

## 1) المتطلبات
- PHP 8.1 أو 8.2 أو 8.3.
- MySQL database من Hostinger.
- Composer.
- Node غير مطلوب على الاستضافة إذا رفعت النسخة الحالية لأنها تحتوي `public/build` جاهز.

## 2) رفع الملفات
ارفع محتويات المشروع إلى:
```text
public_html
```

النسخة تحتوي ملف `.htaccess` في جذر المشروع يحوّل الطلبات إلى مجلد `public`.

الأفضل أمنيًا إن أمكن:
- ملفات Laravel خارج `public_html`
- ومحتوى مجلد `public` فقط داخل `public_html`

لكن لو الاستضافة المشتركة لا تسمح، ارفع المشروع كاملًا داخل `public_html` مع `.htaccess` الموجود.

## 3) إعداد ملف .env
انسخ:
```bash
cp .env.hostinger.example .env
```

ثم عدّل:
```env
APP_URL=https://YOUR-DOMAIN.COM
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
SESSION_DOMAIN=.YOUR-DOMAIN.COM
SANCTUM_STATEFUL_DOMAINS=YOUR-DOMAIN.COM,www.YOUR-DOMAIN.COM
```

ثم أنشئ مفتاح التطبيق:
```bash
php artisan key:generate --force
```

## 4) أوامر الإنتاج
من Terminal داخل Hostinger:
```bash
composer install --no-dev --optimize-autoloader
php artisan storage:link
php artisan migrate --seed --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

إذا `storage:link` فشل على الاستضافة المشتركة، أنشئ symlink من File Manager إن أمكن:
```text
public/storage -> storage/app/public
```

## 5) تفعيل Google Login لاحقًا
من Google Cloud Console:
1. أنشئ OAuth Client من نوع Web application.
2. ضع Authorized JavaScript origins:
```text
https://YOUR-DOMAIN.COM
```
3. ضع Authorized redirect URIs:
```text
https://YOUR-DOMAIN.COM/auth/google/callback
```
4. انسخ القيم إلى `.env`:
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN.COM/auth/google/callback
```
5. شغل:
```bash
php artisan optimize:clear
php artisan config:cache
```

## 6) بعد الرفع
افتح:
```text
https://YOUR-DOMAIN.COM
```

ثم جرّب:
- تسجيل الدخول.
- إنشاء حساب.
- Google Login بعد إضافة المفاتيح.
- مركز الاستيراد.
- الإيداع.
- لوحة الإدارة.

## 7) ملاحظات أمنية
- لا ترفع `.env` حقيقي إلى GitHub.
- لا تترك `APP_DEBUG=true` في الإنتاج.
- لا تستخدم SQLite في الإنتاج.
- استخدم MySQL من Hostinger.
