# v28_40 Import Hierarchy Fix

- Fixed Shams-like import hierarchy so items that behave like products do not become empty store categories.
- Remote categories are no longer created in the store before they are confirmed to contain children/products.
- Leaf remote categories that return no children are checked once as products and published under the parent category.
- Store hides empty imported sections so old wrong categories stop appearing to customers.
- `sh7nle:repair-provider-imports` now trims product-name leaf folders and can prune empty imported sections with `--prune-empty-sections`.
