# V28.2 fixes

- Fixed raw EditableText text appearing inside Deposit buttons.
- Made wallet/gift/wheel migrations idempotent to avoid partially-created-table crashes.
- Added controller guards so wheel/wallet pages do not crash if migrations were not completed yet.
- Improved imported-product card label from "القسم الحالي" to the selected target section name.
- PHP syntax and npm build were verified after these fixes.
