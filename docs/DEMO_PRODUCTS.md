# KLEID.IN — 15 safe demo products

This file gives you realistic-looking **sample catalog content**, not real merchandise or inventory.

## Included

- 15 distinct T-shirt / polo product listings with unique `KLD-DEMO-###` SKUs.
- Two suggested colours per product, with colour hex codes.
- Four size rows per colour: S, M, L, XL.
- **120 CSV rows**; the bulk importer merges rows with the same SKU into one product.
- Example Indian rupee prices, category names, and short descriptions.

## Deliberately safe defaults

- `status=draft` — products are NOT listed on the live public store.
- `stock=0` — no fake stock availability.
- `offer_enabled=false` — no fake LIMITED OFFER promotions or timers.
- Image URL fields are empty — do not represent sample image URLs as photos of goods you possess.
- No fictitious reviews, sales, customers, orders or testimonials are generated.

## Import to the admin portal

1. Open **Admin → Products → Excel import**.
2. Click **Download 15 demo products** (or obtain `public/templates/kleidin-15-demo-products.csv` in GitHub).
3. Upload that CSV file using **Choose CSV file**.
4. Confirm the preview says **120 rows / 15 products**.
5. Click **Import products**. You will get 15 **draft** product records with size and colour variants.
6. Before publishing, review and replace names, descriptions, photos, prices and real available stock. Upload actual product images through the admin UI. Only mark a product **Active** when you intend to sell it.

### Note on existing products

The bulk import updates records with a matching SKU. These SKUs have the `KLD-DEMO-` prefix to reduce accidental collisions, but review imports before confirming.

### What this is not

This CSV is not an inventory confirmation, image generator, payment setup, customer-orders import, or automatic product publishing process.
