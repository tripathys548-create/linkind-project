# Remaining Work — WebElvate LinkedIn Extension

Status: code complete, tested (29/29 backend tests pass, `tsc --noEmit`
clean), not deployed. Nothing below touches license-binding, webhook
signature verification, or admin auth — those were reviewed and are
correct as-is; don't let Antigravity "improve" them without a specific
reason.

## A1. Provision real accounts and secrets
- [ ] Create a Neon Postgres database, run `backend/db/schema.sql` against it.
- [ ] Create a Cloudflare account, `wrangler login`.
- [ ] Create a Razorpay account (test mode first), get `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
- [ ] Pick an LLM provider (Gemini Flash / GPT-4o-mini class) and get an API key.
- [ ] Pick a transactional email provider (Resend/Brevo) and get an API key.
- [ ] Choose an `ADMIN_PASSWORD`.
- **Comment for Antigravity:** none of this is a coding task — these are accounts only you can create. Do this before assigning A2.

## A2. Deploy the backend
- [ ] `wrangler secret put` for all 9 secrets listed in `README.md`.
- [ ] `npx wrangler deploy` from `backend/`.
- [ ] Register a Razorpay webhook pointing at `<deployed-url>/payment-webhook`; set its signing secret as `RAZORPAY_WEBHOOK_SECRET`.
- **Comment for Antigravity:** "Deploy the backend in `backend/` per its README.md. Confirm the deployed URL responds to a `POST /create-order` with a valid Razorpay order object before reporting done."

## A3. Wire up the frontend placeholders
- [ ] Replace `BACKEND_URL` in `extension/src/background/background.js` with the deployed Workers URL.
- [ ] Replace `BACKEND_URL` and `RAZORPAY_KEY_ID` (public key only) in `checkout/checkout.js`.
- [ ] Replace `YOUR-CHECKOUT-DOMAIN` placeholder in `extension/src/popup/popup.html`.
- **Comment for Antigravity:** "Grep both files for the literal strings `YOUR-SUBDOMAIN`, `YOUR_KEY_ID`, `YOUR-CHECKOUT-DOMAIN` and replace with the real values I give you — don't touch anything else in these files."

## A4. Host the checkout page
- [ ] Deploy `checkout/` as a static site (Cloudflare Pages, Netlify, etc.).
- [ ] Set that origin as `CHECKOUT_ORIGIN` secret on the backend.
- [ ] Set that same origin's CORS in `create-order`'s handler (already reads from env, just needs the secret set correctly).

## A5. Missing pieces the spec deferred, not yet built
- [ ] **Terms & Privacy Policy pages.** `checkout/index.html` links to LinkedIn's own User Agreement but WebElvate has no ToS/Privacy page of its own — needed before real payments, most jurisdictions require this for a paid product.
- [ ] **Admin UI.** `/admin/messages`, `/admin/generations`, `/admin/keys` are working API endpoints (password-gated) but have no frontend — right now checking them means hand-crafting authenticated `curl`/Postman requests. Decide if that's acceptable long-term or if a minimal internal HTML page is worth building.
- [ ] **Support reply delivery.** Admin can write `admin_reply` into `support_messages`, but nothing emails it to the user — replying today means manually emailing them outside the system. Fine for low volume; revisit if it becomes a bottleneck.
- **Comment for Antigravity:** these three are genuinely optional for a v1 launch — flag them as "nice to have before scale, not before launch" rather than blockers.

## A6. Explicitly out of scope (don't build unless you change your mind)
- Bulk/college licensing (batch key generation) — spec deferred this deliberately.
- Self-serve license rebinding — deferred to manual support.

## A7. Before accepting real money
- [ ] One full manual pass with Razorpay **test mode**: pay → webhook fires → key emailed → extension activates → key binds on first rewrite → resume generates once and re-serves on second click → DM generates.
- [ ] Switch Razorpay from test to live keys only after the above passes.

## Suggested order

A1 → A2 → A3 → A4 → A7 (get it actually live — it's ready, just not
deployed). A5 can happen anytime, independent of the rest.

---

**Note:** CareerCraft was previously (mistakenly) documented as "Part B"
of this file. It's a separate, standalone product in its own repo:
[careercraft-landing](https://github.com/tripathys548-create/careercraft-landing).
Nothing about it belongs here.
