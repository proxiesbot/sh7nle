# V28.13 - EditableText + Language Refresh Patch

## تم التعديل

### 1) تحسين EditableText
- صار يتزامن مع النصوص القادمة من Inertia بعد التنقل بين الصفحات.
- صار يمنع حفظ نص فارغ.
- تم تحسين تجربة التحرير بأزرار حفظ/إلغاء أوضح.
- دعم حفظ سريع عبر Ctrl/Cmd + Enter.
- دعم إلغاء التحرير عبر Escape.
- استبدال زر "تعديل النص" الطويل بأيقونة أخف حتى لا يخرب شكل الواجهة.

### 2) تحسين GlobalTextEditor
- تثبيت مفتاح النص الأصلي داخل WeakMap حتى لا يتغير المفتاح بعد تعديل النص.
- حل مشكلة إنشاء مفاتيح جديدة عند الضغط على نص تم تعديله مسبقًا.
- تطبيق النصوص المحفوظة على النص الأصلي حتى بعد تحديث DOM من Inertia.
- إضافة مؤشر حفظ خفيف.
- إضافة Outline عند تفعيل وضع تعديل النصوص حتى يعرف السوبر أدمن أي نص قابل للتعديل.
- منع تعديل العناصر الحساسة مثل input / textarea / select / script / svg / canvas.

### 3) تغيير اللغة مع Refresh
- `setLocale` صار يعمل Refresh كامل بعد تغيير اللغة افتراضيًا.
- السبب: ضمان تبديل كل النصوص والاتجاه RTL/LTR داخل كل صفحات Inertia بدون بقاء نصوص قديمة.
- يمكن تعطيل الريفريش برمجيًا عبر: `setLocale('en', { reload: false })` عند الحاجة.

## فحص سريع
- تم تشغيل: `npm run build`
- النتيجة: Build ناجح.
- ملاحظة البناء الوحيدة: Vite أعطى تنبيهًا أن `/images/brand/auth-bg.jpg` سيُحل runtime، والملف موجود داخل `public/images/brand/auth-bg.jpg`.

## الملفات المعدلة
- `resources/js/components/EditableText.jsx`
- `resources/js/components/GlobalTextEditor.jsx`
- `resources/js/lib/sitePreferences.js`
- `resources/css/app.css`
