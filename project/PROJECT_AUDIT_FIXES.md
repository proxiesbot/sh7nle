# Project Audit Fixes

This package includes the practical fixes from the audit:

- Removed `.env` from the distributable archive and sanitized `.env.example`.
- Kept SSL verification disabled only in local environment if explicitly configured.
- Removed CSRF bypasses and kept normal Laravel CSRF protection.
- Hardened duplicate deposit transaction prevention with a global unique `paymentId` index.
- Fixed duplicate unique-index migrations that could break `php artisan migrate`.
- Added rate limiting to the deposit webhook route.
- Strengthened image upload validation in section creation.
- Updated npm lockfile via `npm audit fix` while avoiding breaking upgrades.
- Verified `npm run build` succeeds after changes.

Before production, set real values in `.env` on the server and use `APP_DEBUG=false`.
