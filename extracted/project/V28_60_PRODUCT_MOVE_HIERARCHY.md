# V28.60 - Product Move Hierarchy Fix

- Added a direct product move action in the admin products page.
- The move modal now shows only main sections first.
- After selecting a main section, only its direct child sections appear.
- Admin can stop at any level and move the product directly into that selected section.
- Admin can also move the product directly to the home/main page.
- Backend `card.moveSection` now safely supports moving products to root (`section_id = 0`) or to a selected section.
- Moving a product clears old `subcategory_id` to avoid stale subcategory relationships.

Build verified with `npm run build`.
PHP syntax verified for `CardController.php`.
