# Opt-in storefront demo catalog

The demo catalog is **OFF by default**. With a MongoDB connection configured, open **Admin → Settings → Website settings → Section visibility** and switch **Demo catalog (only when no real products)** to ON, then save.

- The six photo-backed previews are displayed **only if there are zero real published products**. A real product collection always takes precedence.
- Demo product data is generated from `src/lib/demo-products.ts`; it does **not** insert MongoDB products, customers, orders, inventory movements, reviews or ratings.
- Demo cards and details show **Demo preview** / **Example price**. Demo checkout / WhatsApp ordering and Add to bag are disabled.
- Sample photos are **not** photos of KLEID.IN products and must be replaced with authentic product photography before publishing real listings.
- Turn the setting OFF to return to an empty real catalog, or add your real published products to automatically hide samples.
- In environments without MongoDB or an admin account, the demo stays OFF; setting the switch requires working admin/database configuration.

## Photo sources

The following sample photo references are sourced from Unsplash pages labeled free under the Unsplash License (check current licensing/attribution before use, and maintain independent source references):

1. [Ryan Hoffman — black crew neck t-shirt](https://unsplash.com/photos/black-crew-neck-t-shirt-Cs4GVbMqKGY)
2. [Mediamodifier — white crew neck t-shirt](https://unsplash.com/photos/white-crew-neck-t-shirt-elbKS4DY21g)
3. [mockupbee — cotton shirt mockup](https://unsplash.com/photos/a-white-shirt-on-a-white-background-4rUYuwJ2vGw)
4. [Ryan Hoffman — black crew neck t-shirt](https://unsplash.com/photos/black-crew-neck-t-shirt-6Nub980bI3I)
5. [Avtar Singh — shirt on a hanger](https://unsplash.com/photos/a-plain-white-t-shirt-hangs-on-a-wooden-hanger-8ACmRoleM24)
6. [Derick McKinney — shirt on hanger](https://unsplash.com/photos/white-crew-neck-shirt-on-hanger-cmbbXRjYUZA)

Images are requested from `images.unsplash.com` via Next Image with `fit=max`. Sample photo shades or model silhouettes may differ from the illustrative product names — these previews are for design only.

## Verify

Run `npm ci && npm run check`. Inspect `/products`, `/products/preview-core-black-tee`, `/cart`, and home on both small and large screens. In particular verify that images are completely visible in cards and that no sample product can be purchased.
