# KLEID.IN — Production deployment checklist

The Next.js app serves both the storefront and the admin API. It needs a **persistent MongoDB database** and **Cloudinary** for image uploads. Vercel's filesystem is not persistent storage; do not rely on local files for live product data or uploaded images.

## 1. Deployment platform

1. Connect `AMNAS-skylora/T-shrit` to a Vercel project using the **main** branch.
2. Use **Node.js 22.x** in Project Settings. The project also declares `engines.node: "22.x"`.
3. Framework preset: **Next.js**. Root directory: repository root.
4. Install command: `npm ci`; build command: `npm run build`. Leave the output directory to Next.js/Vercel defaults.
5. Configure the production domain under Vercel Domains. Use HTTPS.

Do **not** commit `.env.local`, passwords, database URLs, keys, or account screenshots.

## 2. Required Production environment variables

Set these in Vercel **Project Settings → Environment Variables**, scope **Production** (and Preview separately if those previews need real services). Redeploy after changes.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection URI, including credentials and database access |
| `MONGODB_DB` | Database name, e.g. `kleidin` |
| `ADMIN_EMAIL` | Bootstrap admin login email |
| `ADMIN_PASSWORD` | Strong bootstrap admin password; replace in Admin → Account after first sign-in |
| `ADMIN_SESSION_SECRET` | Long, unpredictable secret of **at least 32 characters** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Optional storefront contact/social values: `NEXT_PUBLIC_PHONE_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`. Product, inventory and store settings are managed in Admin and stored in MongoDB.

**Important:** values beginning with `NEXT_PUBLIC_` are embedded in client code. Never put secrets in those variables. Do not re-use the admin login password elsewhere. If a secret is disclosed, rotate it immediately, then redeploy.

Atlas connectivity requires a database user with suitable permissions and an Atlas network access rule that permits your hosting environment. Restrict network access as much as your hosting setup supports. Keep MongoDB backups and Cloudinary quota/storage limits configured in their own dashboards.

## 3. Test before a live deploy

In a terminal with Node.js 22:

```bash
npm ci
npm run check
```

`npm run check` runs the TypeScript check, automated tests, and a Next.js production build. GitHub Actions also performs `npm audit --audit-level=high` and these checks on pull requests and pushes to `main`.

## 4. Go-live verification

After deployment, use the production domain:

- Open `/api/health`. A healthy fully-configured system returns **HTTP 200** with `ok: true`, `database: "ok"`, `adminConfigured: true`, and `cloudinaryConfigured: true`. A missing service or DB failure returns **503**; resolve it **before** going live.
- Sign in at `/admin/login` with the configured admin credentials. Change your bootstrap credentials through the account settings, and verify that the previous session is invalidated.
- Create a real category/product, upload an image, set a price/stock and verify the public `/products` and individual product pages. Do not use demo inventory in production.
- Verify offer start/end times, expired-offer pricing, sold-out stock state, responsive product cards and the WhatsApp enquiry URL with the real store number.
- Verify Admin → Products, Inventory, Orders, Customers, Settings and image uploads; test a failed upload and a disconnected backend.
- Check on a **real iPhone Safari and Android Chrome**, including drawer dialogs, product selectors, try-on camera permission (requires HTTPS), and mobile safe areas.
- Verify public pages are not embedded in frames and that admin API responses cannot be cached by shared caches.

The storefront currently uses **WhatsApp enquiry/order workflows**, not a full online payment checkout. Do not advertise automated card payments unless a payment gateway has been implemented and tested.

## 5. Production operation and recovery

- Keep MongoDB backups, Cloudinary asset backups/retention, and your custom domain DNS under your control.
- Monitor Vercel deployment/function logs and `/api/health`; a passing code build does not guarantee the database can be reached from the deployed function.
- If deployment fails, use the Vercel build logs to identify the missing variable or build step; rollback to the last healthy Vercel deployment if needed.
- **Do not** copy production credentials into Issues, ChatGPT prompts, or GitHub commits. Share only redacted error excerpts when debugging.
