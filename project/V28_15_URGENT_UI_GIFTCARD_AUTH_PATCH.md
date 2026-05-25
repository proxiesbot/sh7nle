# Sh7nle v28.15 urgent UI/auth/gift-card patch

تم تنفيذ باتش شامل بعد مشاكل الرفع على Hostinger، بدون حذف الميزات السابقة.

## المنجز

- إصلاح خطأ Vite 500 نهائيًا عبر جعل `app.blade.php` يعتمد على `resources/js/app.jsx` فقط، لأن CSS صار مربوطًا تلقائيًا داخل manifest.
- تحسين القائمة العامة والـ 4 أزرار السريعة + أزرار السوشال لتظهر بشكل أنظف واحترافي على الموبايل والكمبيوتر.
- إصلاح ظهور لوحة الإدارة عبر قراءة الأدوار بشكل مرن: `Super-Admin`, `Super Admin`, `admin`, `Admin`.
- تحسين وضوح زر تعديل النصوص للسوبر أدمن، وإضافة زر مباشر داخل هيدر لوحة الإدارة باسم “تعديل النصوص”.
- إعادة تصميم واجهات Login/Register لتجنب تداخل الصور وتحسين الحقول والاتجاه العربي/الإنكليزي.
- إضافة صفحات نسيت كلمة المرور وإعادة تعيين كلمة المرور لـ Fortify/Inertia.
- تحسين تجربة إنشاء الحساب وإظهار أخطاء الحقول بشكل أوضح.
- إعادة تصميم عجلة الفرصة بالكامل بشكل احترافي مع شرح أفضل لطريقة اكتساب اللفات.
- إضافة منتج داخلي باسم `Sh7nle Gift Card` ضمن قسم `Sh7nle Gift Cards` بالفئات: 5 / 10 / 15 / 20 / 25 / 50 دولار.
- شراء Gift Card يولد كود داخلي مباشر ويظهر في صفحة طلباتي، ويمكن استرداده من زر Gift Card.
- إضافة أيقونة SVG خاصة ببطاقات Sh7nle Gift Card.

## أوامر السيرفر المطلوبة بعد رفع النسخة

```bash
php ~/domains/sh7nle.com/artisan migrate --force
php ~/domains/sh7nle.com/artisan optimize:clear
php ~/domains/sh7nle.com/artisan view:clear
php ~/domains/sh7nle.com/artisan config:clear
php ~/domains/sh7nle.com/artisan route:clear
```

بعد التأكد من عمل الموقع:

```bash
php ~/domains/sh7nle.com/artisan config:cache
php ~/domains/sh7nle.com/artisan route:cache
php ~/domains/sh7nle.com/artisan view:cache
```
