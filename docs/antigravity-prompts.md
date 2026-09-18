# Ready-to-Paste Antigravity Prompts

Each prompt below is self-contained — paste one at a time, review the
diff/result before moving to the next. They map to `TODO.md`. Anything
needing a decision only you can make (account creation, legal content,
the LinkedIn-import mechanism) is called out inline rather than baked
into the prompt as an assumption.

---

## WebElvate — Deploy (do A1 yourself first)

Before using this prompt, you must have already: created the Neon DB
and run `schema.sql` against it, created a Cloudflare account, gotten
Razorpay test-mode keys, an LLM API key, an email provider API key, and
chosen an admin password. Have all 9 values ready to paste when
Antigravity asks.

```
Deploy the backend in backend/ (Cloudflare Workers). Steps:

1. Read backend/README.md for the full list of required secrets.
2. Run `npx wrangler secret put <NAME>` for each of the 9 secrets
   listed there — I will paste each value when prompted, one at a
   time. Do not print secret values back to me or log them anywhere.
3. Run `npx wrangler deploy` from the backend/ directory.
4. Confirm the deployment by sending a POST request to
   <deployed-url>/create-order and showing me the raw response — it
   should be a JSON object with `id`, `amount`, and `currency` fields
   from Razorpay, not an error.
5. Report the deployed Workers URL back to me.

Do not modify any application code in this task — this is deploy and
verify only.
```

---

## WebElvate — Wire frontend placeholders

Run after the deploy prompt above, once you have the real deployed URL
and your Razorpay public key.

```
Three files in this repo have literal placeholder strings that need
replacing with real values I'll give you:

- extension/src/background/background.js: replace `BACKEND_URL`'s
  placeholder value with <PASTE DEPLOYED WORKERS URL>
- checkout/checkout.js: replace `BACKEND_URL`'s placeholder with the
  same URL, and `RAZORPAY_KEY_ID`'s placeholder with
  <PASTE RAZORPAY PUBLIC KEY ID> (public key only — never the secret
  key, which must never appear in this file)
- extension/src/popup/popup.html: replace the `YOUR-CHECKOUT-DOMAIN`
  placeholder in the "Purchase here" link with <PASTE CHECKOUT DOMAIN>

Grep for these exact placeholder strings first, show me every match
before editing, then make only these replacements — don't touch
anything else in these three files.
```

---

## WebElvate — Host the checkout page

```
Deploy the checkout/ directory as a static site on Cloudflare Pages
(or Netlify if you tell it that instead). It's plain HTML/CSS/JS, no
build step needed. Once deployed:

1. Report the live URL back to me.
2. I will then run `npx wrangler secret put CHECKOUT_ORIGIN` in
   backend/ with that URL myself.

Don't change any code in checkout/ as part of this — deploy only.
```

---

## WebElvate — Admin UI (currently API-only)

```
The backend has three working, password-gated admin API routes with no
frontend: GET /admin/messages, GET /admin/generations, GET /admin/keys
(see backend/src/routes/admin.ts and backend/src/lib/adminAuth.ts for
the exact auth mechanism — a Bearer token compared to ADMIN_PASSWORD).

Build a minimal internal admin page at a new path, e.g. admin/index.html
(plain HTML/JS, no framework, matching this repo's existing style of
not using a build step for static pages):

- A password field (stores the entered password in memory only, never
  localStorage) used as the Bearer token on every request.
- Three tabs or sections: Support Messages, Generated Content, License
  Keys — each just renders the JSON array from its endpoint as a
  simple table.
- For Support Messages, add a way to view a message and PATCH/POST a
  reply into `admin_reply` (check if that write endpoint exists yet in
  admin.ts — if not, add a `POST /admin/messages/:id/reply` route
  first, following the existing route file patterns).

Deploy this as its own static page, not linked from any public page
(per the spec's requirement that the admin panel stays undiscoverable).
Tell me where you deployed it.
```

---

## WebElvate — Support reply email delivery

```
Right now, backend/src/routes/admin.ts lets an admin write an
`admin_reply` onto a support_messages row, but nothing emails it to
the user. Add that: after a reply is saved, call the existing
sendLicenseKeyEmail pattern in backend/src/lib/email.ts (add a new
function, e.g. sendSupportReplyEmail, following the same shape) to
email the reply to the support_messages row's `email` column. Write a
test for it following the existing pattern in backend/test/email.test.ts.
```

---

## WebElvate — Terms & Privacy Policy pages

```
checkout/index.html and the extension popup link to LinkedIn's own
User Agreement but WebElvate has no Terms of Service or Privacy Policy
page of its own. Create checkout/terms.html and checkout/privacy.html
matching the existing checkout page's design system (see
checkout/checkout.css — same fonts, colors, borders, no new dependencies).

IMPORTANT: Do not write the actual legal content yourself. Fill each
page with clearly marked placeholder sections (e.g. "[PLACEHOLDER:
data retention policy — needs legal review]") for every substantive
clause, and only fill in the parts that are pure fact from the existing
spec (e.g. "we store license keys, email addresses, and rewrite/DM/resume
outputs" — read docs/superpowers/specs/2026-09-18-linkedin-audit-extension-design.md
§7 and §12 for what's actually stored). Link both new pages from the
footer of checkout/index.html and from the popup's first-run disclaimer.
```

---

## CareerCraft — Backend scaffold (decide LinkedIn-import mechanism first)

**Before running this prompt**, decide how CareerCraft gets a user's
LinkedIn data: (a) LinkedIn OAuth (likely too restricted for this use
case — check LinkedIn's API terms before committing to this), (b) a
browser extension reading the logged-in user's own profile (same
pattern and same ToS risk as the WebElvate extension), or (c) the user
manually pastes their profile text into a form (safest, weakest UX).
The prompt below assumes you tell Antigravity which one at the start.

```
Build a new, separate Cloudflare Workers backend for CareerCraft under
a new careercraft-landing/backend/ directory, structured like
backend/ in this repo (same file layout: src/lib, src/routes, db/schema.sql,
test/, wrangler.toml) but for a different product:

- Auth: email + OTP sign-in (send OTP via the same email-provider
  pattern as backend/src/lib/email.ts). Store sessions as a signed
  token, not in a database session table, to keep this simple.
- Payment: a Razorpay one-time ₹199 flow, closely following
  backend/src/routes/createOrder.ts and paymentWebhook.ts — same
  idempotency-on-payment-ID pattern, same webhook signature
  verification in backend/src/lib/razorpay.ts (copy that file as-is,
  it's provider-agnostic).
- LinkedIn data capture: implement <THE MECHANISM YOU CHOSE ABOVE>.
- Do NOT reuse the WebElvate database or Cloudflare Worker — this is a
  fully separate deployment with its own secrets and its own Neon
  database, per TODO.md's B1.

Write tests for the auth and payment logic following this repo's
existing Vitest patterns (see backend/test/ for examples). Do not build
the LLM rewrite endpoints or PDF rendering yet — that's a separate task.
```

---

## CareerCraft — LLM rewrite endpoints

```
In careercraft-landing/backend/, add endpoints for rewriting a
LinkedIn profile's headline, About section, experience, and skills —
follow the exact pattern in this repo's backend/src/lib/llm.ts
(callLLM + callLLMJson with the retry-on-malformed-JSON behavior) and
backend/src/routes/rewriteProfile.ts (validate auth session, check
rate limit, call LLM, store output, return JSON). Reuse
backend/src/lib/rateLimit.ts as-is.

Write the system prompts to match CareerCraft's positioning: headline
optimized for recruiter search, About as a three-part narrative,
experience bullets with action verb + metric, skills reordered by
relevance to a target role if one is provided.
```

---

## CareerCraft — PDF template rendering

```
The landing page at careercraft-landing/src/components/Templates.jsx
shows 5 illustrative template styles: Fresher, Advanced, Expert,
Technical, Executive. Build real PDF rendering for these in
careercraft-landing/backend/src/lib/pdf.ts using pdf-lib (see
backend/src/lib/pdf.ts in this repo's WebElvate backend for the
baseline single-template approach — extend that pattern to 5 distinct
layouts instead of 1). Each template should visually match its
Templates.jsx preview card's layout logic (e.g. Technical has a
skills-chip row near the top, Executive is minimal with thin rule
lines, Fresher is single-column with an accent header bar).
```

---

## CareerCraft — Wire the demo and pricing to the real backend

```
careercraft-landing/src/components/TransformDemo.jsx currently shows a
hardcoded canned example on submit, and Pricing.jsx's "Sign In & Pay
₹199" link goes nowhere. Once the CareerCraft backend (auth, payment,
LLM endpoints) exists, wire these up:

- TransformDemo.jsx: after a signed-in user pastes their real profile
  data (via whatever capture mechanism was built), call the real
  rewrite endpoint instead of showing EXAMPLE. Keep the
  "this is an example, not your profile" framing ONLY for
  signed-out visitors — a signed-in, paid user should see their real
  rewrite, clearly not labeled as an example.
- Pricing.jsx: wire "Sign In & Pay ₹199" to the real auth + Razorpay
  Checkout flow, following checkout/checkout.js's pattern in this repo
  for opening the Razorpay modal.

Don't change the copy or layout of either component — only replace the
mocked behavior with real calls.
```

---

## CareerCraft — Terms & Privacy, and testimonials

```
Two content gaps in careercraft-landing/src/components/:

1. Testimonials.jsx has 3 placeholder quotes that were never real
   customers. Either remove the section entirely, or replace them —
   I will provide real testimonial text; do not write new ones
   yourself.
2. Pricing.jsx, TransformDemo.jsx, and Footer.jsx all link to
   "Terms & Privacy Policy" via href="#". Build real terms.html and
   privacy.html pages (or React routes if you've added routing) with
   the same placeholder-section approach as WebElvate's terms/privacy
   task — mark every substantive legal clause as
   "[PLACEHOLDER: needs legal review]" rather than inventing policy
   language, and only state pure facts about what CareerCraft actually
   stores/processes once that's built.
```
