# KLEID.IN

KLEID.IN is a Next.js ecommerce storefront with a built-in Next.js API backend and admin control panel.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Cloudinary

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows:

```bash
copy .env.example .env.local
npm run dev
```

Storefront: `http://localhost:3000`  
Admin: `http://localhost:3000/admin`  
Health: `http://localhost:3000/api/health`

## Environment variables

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_FACEBOOK_URL=

MONGODB_URI=
MONGODB_DB=kleidin

ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit real secrets to GitHub. Configure the same private variables in Vercel Project Settings for Production.

## Admin control

The admin panel includes:

- Dashboard KPIs
- Product create/edit/delete
- Product images through direct Cloudinary uploads
- Featured and featured-animation controls
- Dealer/wholesale product fields
- Inventory adjustments and stock history
- Manual order creation
- Order status, payment status, courier and tracking controls
- Automatic stock deduction and restore on cancellation/return/refund
- Customer list, notes and block/active control
- Homepage hero management
- Storefront/Home/About/social settings

## Backend API

Admin APIs live under `/api/admin/*` and require the secure HttpOnly admin session cookie.

Main routes:

```text
/api/admin/session
/api/admin/dashboard
/api/admin/products
/api/admin/products/:id
/api/admin/inventory
/api/admin/orders
/api/admin/orders/:id
/api/admin/customers
/api/admin/customers/:id
/api/admin/hero
/api/admin/hero/:id
/api/admin/settings
/api/admin/uploads/signature
```

MongoDB indexes are created automatically when the backend connects.

## Frontend fallback

If MongoDB is not configured or temporarily unavailable, the public storefront falls back to the local data/config in `src/data` so the site can still render.

Section visibility is managed in Admin → Settings → Edit settings → Section visibility. All new section switches default to On, including for existing databases. Save applies the switches to the storefront without deleting content. Footer visibility applies across public pages.

Copy `.env.example` to `.env.local` for local setup, or set these variables on the hosting server. MongoDB, admin credentials and signed Cloudinary upload credentials are required for live administration. `/api/health` returns 503 until these are configured and the database responds; Admin Settings shows the connection status. Without MongoDB configuration the storefront is a demo. A configured database failure displays an error rather than sample inventory.
