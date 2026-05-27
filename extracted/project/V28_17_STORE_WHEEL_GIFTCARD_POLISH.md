# V28_17 Store, Wheel, Gift Card Polish

## Focus
- Improved public store hero and mobile layout.
- Improved store section cards and product cards.
- Added dedicated Sh7nle Gift Card products for 5 / 10 / 15 / 20 / 25 / 50 USD.
- Improved Chance Wheel UI and professional explanation of how spins are earned.
- Kept the previous auth RTL/LTR fixes and redesigned login/register pages.

## Deployment Notes
- This package includes a fresh `public/build` generated locally.
- Hostinger does not need npm.
- After uploading, copy `public/build` to `public_html/build`.
- Run `php artisan migrate --force` to add/refresh the Gift Card denominations.
