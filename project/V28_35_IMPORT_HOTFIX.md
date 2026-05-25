# V28.35 Import Hotfix

- Restores provider sources automatically if DB cleanup removed them.
- Restores Sh7nle Gift Card system products if missing.
- Adds clearer provider preflight checks before import starts.
- Improves Shams catalog parsing for mixed/nested response shapes.
- Keeps progressive import behavior and continues saving product-by-product.
- Adds `php artisan sh7nle:repair-provider-imports` to publish previously imported provider products into visible store cards if they stayed only in Imported Products.
