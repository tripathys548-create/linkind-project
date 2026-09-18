# LinkedIn Profile Audit & Referral DM Extension — Design Spec

**Version**: 1.0  
**Date**: 2026-09-18  
**Author**: Sameer

---

## §1 — Product Purpose

A Chrome extension that reads a user's LinkedIn profile (read-only DOM scraping) and:
1. Rewrites their Headline, About, and Experience sections using an LLM.
2. Generates a tailored cold-outreach DM to a recruiter or senior employee for referral purposes.
3. Produces a one-time free resume PDF built from their LinkedIn profile data.

The extension never writes to LinkedIn's DOM. All content-script logic is strictly read-only.

---

## §2 — Pricing Model

₹200 flat, one-time per LinkedIn account. No subscriptions, no time-boxing, no renewals.  
One license key = one LinkedIn account ID (bound on first use).

---

## §3 — Payment Flow

- User visits the checkout page.
- After acknowledging the ToS/ban-risk disclaimer, they pay ₹200 via Razorpay.
- Razorpay webhook fires → backend generates a license key → emails it to the buyer.
- User installs the extension, pastes the key, and activates.

---

## §4 — License Key Format

`LKX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX` (uppercase hex, 32 random bytes from `crypto.getRandomValues`).

---

## §5 — Extension Behaviour & ToS Disclaimer

- Content script is read-only: it queries DOM elements and returns data via `chrome.runtime.sendMessage`. It never injects, modifies, or submits anything.
- A hard disclaimer screen ("this may violate LinkedIn's ToS and risk account restriction") with an affirmative acknowledgment checkbox must be cleared before the key screen or main screen appears. This is not skippable.
- Key binding: on first `validate-key` or any LLM route call, the backend binds the key to the LinkedIn profile ID extracted from the URL. Subsequent calls from a different profile ID return `mismatched_account`.

---

## §6 — Backend Routes

| Method | Path | Auth | CORS Origin |
|--------|------|------|-------------|
| POST | `/create-order` | None | `CHECKOUT_ORIGIN` |
| POST | `/payment-webhook` | Razorpay signature | None |
| POST | `/validate-key` | License key in body | `EXTENSION_ORIGIN` |
| POST | `/rewrite-profile` | License key in body | `EXTENSION_ORIGIN` |
| POST | `/generate-dm` | License key in body | `EXTENSION_ORIGIN` |
| POST | `/generate-resume` | License key in body | `EXTENSION_ORIGIN` |
| POST | `/support-message` | None | `EXTENSION_ORIGIN` |
| GET | `/admin/messages` | Bearer password | None |
| GET | `/admin/generations` | Bearer password | None |

---

## §7 — Data Persistence Rules

- Raw scraped text is **never** persisted.
- Only LLM-generated output is stored in `generated_content`.
- `license_keys` stores the key, email, bound LinkedIn ID, payment ID, status, and resume-generated timestamp.
- `usage_log` tracks per-endpoint call counts for rate limiting.
- `support_messages` stores user-submitted support messages.

---

## §8 — Rate Limiting

- Per-key daily cap: 50 LLM calls across all endpoints combined.
- Per-IP rate limit on `/create-order`: 5 requests per minute (in-memory, per Worker isolate).
- The resume endpoint is further gated: once generated, the stored PDF is re-served without calling the LLM again (one-time generation, unlimited re-downloads).

---

## §9 — LLM JSON Parsing

`callLLMJson` parses the LLM response as JSON. On a parse failure, it retries once with a stricter system prompt ("Return ONLY valid JSON, no markdown fences"). If the retry also fails, it throws `Error('llm_json_parse_failed')` and the route returns HTTP 502.

---

## §10 — Design Constraints (Checkout Page & Popup)

No gradient hero sections. No glassmorphism. No emoji-as-icons. No stock-photo illustrations. No centred-template layouts. Use clean, high-contrast, typographically clear layouts only.

---

## §11 — Resume PDF Rendering

Rendered using `pdf-lib` inside the Cloudflare Worker. No headless browser, no Puppeteer, no Chromium dependency. US Letter page size (612×792 pt). Sections: Name, Headline, Summary, Experience, Education, Skills.

---

## §12 — Admin Panel

Password-gated (Bearer token vs. `ADMIN_PASSWORD` env var) routes accessible only by the operator. Never linked from any public page. Returns: open support messages, generated content by key. Admin can see `output_json` but not raw scraped input (which is never stored — §7).

---

## §13 — Secret Management

All secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `LLM_API_KEY`, `EMAIL_API_KEY`, `DATABASE_URL`, `ADMIN_PASSWORD`) live exclusively in Cloudflare Workers secrets set via `wrangler secret put`. They are never committed to source or embedded in extension/checkout client code. Only `RAZORPAY_KEY_ID` (the public key) appears in `checkout.js`.

---

## §14 — Manual Verification (Extension)

Content-script DOM selectors must be verified against live LinkedIn profiles because LinkedIn's class names change without notice. Test with a throwaway account. Verify all five flows: disclaimer gate, key activation, profile rewrite, DM generation, resume download (first call) + re-download (second call, no LLM).
