# LinkedIn Profile Booster

A ₹200-per-LinkedIn-account Chrome extension that rewrites a user's
LinkedIn profile (headline, about, experience) into a recruiter-optimized
version, drafts referral-request DMs for profiles the user visits, and
generates one free resume PDF as a post-purchase bonus.

Full design rationale: [docs/superpowers/specs/2026-09-18-linkedin-audit-extension-design.md](docs/superpowers/specs/2026-09-18-linkedin-audit-extension-design.md)

## Repository layout

- `backend/` — Cloudflare Workers API (TypeScript), Neon Postgres for storage
- `extension/` — Manifest V3 Chrome extension (content script, background worker, popup)
- `checkout/` — static Razorpay checkout page
- `docs/superpowers/specs/` — the design spec this was built from

## Backend setup

```bash
cd backend
npm install
```

Apply the database schema to your Neon Postgres database:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### Required secrets

Set these via `wrangler secret put <NAME>` — never commit them or put
them in `wrangler.toml`:

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `RAZORPAY_KEY_ID` | Razorpay key id (also used, non-secretly, in `checkout/checkout.js`) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret, used server-side only to create orders |
| `RAZORPAY_WEBHOOK_SECRET` | Used to verify the `payment-success` webhook signature |
| `LLM_API_KEY` | API key for the LLM provider used in `src/lib/llm.ts` |
| `EMAIL_API_KEY` | Transactional email provider key, used to send license keys |
| `ADMIN_PASSWORD` | Bearer token required on all `/admin/*` routes |
| `EXTENSION_ORIGIN` | The extension's origin, used to scope CORS on user-facing routes |
| `CHECKOUT_ORIGIN` | The checkout page's origin, used to scope CORS on `create-order` |

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler secret put LLM_API_KEY
npx wrangler secret put EMAIL_API_KEY
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put EXTENSION_ORIGIN
npx wrangler secret put CHECKOUT_ORIGIN
```

### Run tests

```bash
cd backend
npm test
```

### Deploy

```bash
cd backend
npx wrangler deploy
```

Note the deployed Workers URL (`https://<name>.<subdomain>.workers.dev`)
— it needs to replace the `BACKEND_URL` placeholder in both
`extension/src/background/background.js` and `checkout/checkout.js`.

## Extension setup

1. Replace `BACKEND_URL` in `extension/src/background/background.js`
   with your deployed backend URL.
2. In Chrome, go to `chrome://extensions`, enable Developer mode, click
   "Load unpacked", and select the `extension/` directory.

## Checkout page setup

1. Replace `BACKEND_URL` and `RAZORPAY_KEY_ID` in `checkout/checkout.js`
   with your deployed backend URL and your Razorpay **public** key id
   (never the secret key).
2. Register a webhook in the Razorpay dashboard pointing at
   `<your-backend-url>/payment-webhook`, and set its signing secret as
   `RAZORPAY_WEBHOOK_SECRET` above.
3. Serve `checkout/` as a static site (e.g. Cloudflare Pages, Netlify)
   and set that origin as `CHECKOUT_ORIGIN`.
