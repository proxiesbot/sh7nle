# V28_24 Provider Import Batches

## What changed

- Category import now works category-by-category instead of scanning all categories first.
- The importer processes all discovered products of the current remote category before moving to the next category.
- The selected local section is treated as a root for batch imports, so products are placed under their remote category path instead of all being dumped into one section.
- The importer retries each category catalog call and merges repeated results to reduce missing products from unstable provider responses.
- SW Games product catalog is cached temporarily to avoid repeated heavy product-list requests and reduce timeout risk.
- Long sleeps between product imports were reduced so the process stays responsive while still avoiding a single huge request.

## Deployment

Upload over the current project, keep `.env`, then clear Laravel caches.
