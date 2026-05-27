# Integrations notes - 2026-03-17

## Kazawallet
- User-facing deposit flow creates a payment link directly.
- No payment id or proof image is required when the payment method provider is `kazawallet`.
- Webhook route: `POST /api/deposit/webhook`
- Required env keys:
  - `KAZAWALLET_API_KEY`
  - `KAZAWALLET_SECRET`
  - `KAZAWALLET_EMAIL`
  - `KAZAWALLET_REF_TOKEN`
  - `CREDIT_PRICE`

## Sawa5Card
- Products can be linked manually using `sawaCardId`.
- Admin can pull metadata from the provider using the preview action in product create/edit pages.
- Product supports:
  - `amount_mode`: `quantity` or `custom_value`
  - `delivery_mode`: `api_codes` or `api_topup`
  - `requires_player_id`
  - `provider_qty_values`
  - `provider_params`

## Orders page behavior
- Pending orders are rechecked with the provider when the page is opened.
- Accepted orders that do not yet have stored delivery codes are rechecked too.
- Rejected orders are refunded once through the `refunded_at` flag.
