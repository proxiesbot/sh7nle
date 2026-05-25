# Batch 10 - Provider, Pricing, Levels, Reseller API

## Added
- Generic provider architecture with `provider_sources` table and admin CRUD.
- Global markup settings and level thresholds in `settings` table.
- Reseller/API level (level 4) with per-user API token.
- Reseller API endpoints for products, product details, orders, and creating orders.
- API docs page for enabled reseller users.
- Banner autoplay controls from settings with manual navigation.

## Changed
- Cards can now be linked to a provider source and provider product id.
- Purchase flow uses provider gateway instead of hardcoded Sawa-only logic.
- Customer levels are auto-resolved from spending, with level 4 reserved for API-enabled users.
- Public layout hides referral entry when referrals are disabled in settings.
- Dashboard shows API access card for enabled users.
- Payment method forms already support automatic/manual mode and input/image requirements.

## Notes
- Run new migrations before testing.
- Existing Sawa integration remains supported and now sits behind the provider gateway.
