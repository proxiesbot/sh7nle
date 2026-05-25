# Feature updates - 2026-03-17

## What changed

### Payment methods
- Added configurable payment methods with:
  - provider (`manual` / `kazawallet`)
  - active/inactive status
  - automatic/manual behavior
  - flags for requiring transaction id and/or proof image
- Kazawallet methods are treated as automatic by design.

### Deposits
- Deposit page now adapts to the selected payment method.
- Manual methods only show the fields the admin enabled.
- Kazawallet flow now creates a payment link directly instead of asking for transaction id or image.
- Webhook handling updated to use `order_id` from Kazawallet docs and remains idempotent.

### Products / games / Sawa5Card
- Cards now support configurable purchase behavior:
  - requires player id or not
  - custom labels for player id and quantity/value fields
  - amount mode (`quantity` vs `custom_value`)
  - delivery mode (`api_codes` vs `api_topup`)
  - provider metadata such as `product_type`, `qty_values`, and `params`
- Admin can fetch product metadata from Sawa5Card docs endpoint using the product ID.

### Orders
- Orders page now displays delivered codes from `replay_api` when available.
- Pending orders are rechecked through Sawa5Card check endpoint.
- Accepted orders with no stored codes are rechecked as well.
- Rejected orders are refunded once.

## New migrations
- `2026_03_17_000004_add_payment_method_automation_columns.php`
- `2026_03_17_000005_add_card_purchase_behavior_columns.php`
- `2026_03_17_000006_add_provider_tracking_to_payments.php`

## Important env variables
- `SAWA_CARD_API_TOKEN`
- `KAZAWALLET_API_KEY`
- `KAZAWALLET_SECRET`
- `KAZAWALLET_EMAIL`
- `KAZAWALLET_REF_TOKEN`
- `CREDIT_PRICE`

## Notes
- For package products where `qty_values` is not provided by Sawa5Card, the system creates repeated single-quantity provider orders when the customer selects a quantity greater than 1.
- This version was syntax-checked with PHP lint. Frontend build still requires local `npm install` on the target machine.
