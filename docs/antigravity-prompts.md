# Ready-to-Paste Antigravity Prompts — WebElvate

Each prompt below is self-contained — paste one at a time, review the
diff/result before moving to the next. They map to `TODO.md`. Anything
needing a decision only you can make (account creation, legal content)
is called out inline rather than baked into the prompt as an assumption.

This file covers WebElvate only. CareerCraft is a separate, standalone
product in its own repo —
[careercraft-landing](https://github.com/tripathys548-create/careercraft-landing)
has its own `TODO.md` and its own `docs/antigravity-prompts.md`.

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

