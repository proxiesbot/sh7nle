# دليل رفع Sh7nle على Hostinger

## 1) المتطلبات
- PHP 8.1 أو 8.2 أو 8.3.
- MySQL database من Hostinger.
- Composer.
- Node غير مطلوب على الاستضافة إذا رفعت النسخة الحالية لأنها تحتوي `public/build` جاهز.

## 2) رفع الملفات (الطريقة الآمنة - مُوصى بها)

### الطريقة المُوصى بها: Laravel خارج public_html

```text
/home/USERNAME/
├── sh7nle/              ← ملفات Laravel كلها هنا (خارج public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── artisan
│
└── public_html/         ← محتوى مجلد public/ فقط هنا
    ├── index.php        ← عدّل المسارات فيه ليشير إلى ../sh7nle/
    ├── build/
    ├── images/
    ├── storage -> ../sh7nle/storage/app/public
    ├── .htaccess
    └── favicon.ico
```

عدّل `public_html/index.php` ليشير للمسار الصحيح:
```php
require __DIR__.'/../sh7nle/vendor/autoload.php';
$app = require_once __DIR__.'/../sh7nle/bootstrap/app.php';
```

### الطريقة البديلة: المشروع كامل داخل public_html

**⚠️ أقل أماناً** - استخدمها فقط إذا الاستضافة لا تسمح بالطريقة الأولى.

ارفع المشروع كاملاً داخل `public_html` واستخدم ملف `.htaccess` الجذري الموجود.

**مهم جداً:** تأكد من وجود `.htaccess` في جذر المشروع (ليس داخل public/) يحتوي على حمايات الملفات الحساسة:

```apache
# Block access to sensitive files and directories
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Block direct access to sensitive files
    RewriteRule ^\.env$ - [F,L]
    RewriteRule ^composer\.(json|lock)$ - [F,L]
    RewriteRule ^package(-lock)?\.json$ - [F,L]
    RewriteRule ^vite\.config\.js$ - [F,L]
    RewriteRule ^artisan$ - [F,L]
    RewriteRule ^phpunit\.xml$ - [F,L]

    # Block access to sensitive directories
    RewriteRule ^app/ - [F,L]
    RewriteRule ^bootstrap/ - [F,L]
    RewriteRule ^config/ - [F,L]
    RewriteRule ^database/ - [F,L]
    RewriteRule ^routes/ - [F,L]
    RewriteRule ^storage/ - [F,L]
    RewriteRule ^vendor/ - [F,L]
    RewriteRule ^resources/ - [F,L]
    RewriteRule ^tests/ - [F,L]
    RewriteRule ^docs/ - [F,L]

    # Route everything else to public/
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>

# Additional protection for specific file types
<FilesMatch "\.(env|log|sql|sqlite)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

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
KAZAWALLET_API_KEY=your_key_here
KAZAWALLET_SECRET=your_secret_here
KAZAWALLET_EMAIL=your_email_here
KAZAWALLET_REF_TOKEN=your_ref_token_here
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

**ملاحظة:** بعد PR #2، تم تحويل كل الـ Closure routes إلى Controller methods ويجب أن يعمل `php artisan route:cache` بدون مشاكل. إذا فشل على Hostinger لأي سبب، شغّل `php artisan route:clear` وتابع النشر بدون route caching.

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
- ❌ لا ترفع `.env` حقيقي إلى GitHub.
- ❌ لا تترك `APP_DEBUG=true` في الإنتاج.
- ❌ لا تستخدم SQLite في الإنتاج.
- ✅ استخدم MySQL من Hostinger.
- ✅ تأكد أن `.htaccess` الجذري يحظر الوصول للملفات الحساسة.
- ✅ استخدم HTTPS (Let's Encrypt مجاني من Hostinger).
- ✅ تأكد أن `storage/` لديها صلاحيات الكتابة (775).
