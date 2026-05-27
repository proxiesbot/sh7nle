هذه النسخة مجهزة على API شمس ستور الحالي:
- base_url = https://api.shams4store.com/client/api
- auth_header = api-token
- catalog_endpoint = /content/{parentId}
- product_endpoint = /products?products_id={id}
- order_endpoint = /newOrder/{id}/params

بعد فك الضغط:
composer install
php artisan optimize:clear
php artisan migrate --seed
npm install
npm run dev
php artisan serve --host=127.0.0.1 --port=8000
