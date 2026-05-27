# V28_19 Wheel/Admin/Dark Polish

## Changes

- Improved admin wheel management page.
- Added direct exact spin balance control for each user.
- Admin can now add, remove, or set final active wheel spins.
- Admin wheel page now lists/searches users, not only users who already have spins.
- Improved dark mode readability for admin tables, inputs, and muted text.
- Reworked chance wheel UI to be cleaner and more professional.
- Made wheel text larger and clearer with stronger contrast and stroke.
- Removed customer-facing wording that reveals prize restrictions or explains that large prizes are unavailable.
- Updated wheel prize fallback message for locked prizes to a neutral “better luck next time” message.

## Deployment Notes

- Copy `public/build` to `public_html/build` after uploading.
- Run `php artisan migrate --force` because one new route/controller action was added but no new migration is required.
- Clear route/cache after uploading.
