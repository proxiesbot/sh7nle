# V28_27 Import Progress Stabilization

- Provider import now separates discovery from import progress.
- Progress display uses: imported/processed vs discovered, instead of a moving total that looks like it never ends.
- Products are saved and published gradually during each poll step, not only at the end of the entire import.
- Small product batches are processed per request to reduce timeout risk while improving speed.
- Duplicate queueing is prevented by provider/product keys.
- Added category scan and product discovery safety limits to avoid endless loops if a provider returns unstable pagination/category data.
- Admin UI now shows category import progress for discovered, processed, added, updated, and failed products.
