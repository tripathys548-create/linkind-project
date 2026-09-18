'use strict';

// TODO: Replace with your actual deployed Cloudflare Worker URL after `wrangler deploy`
const BACKEND_URL = 'https://linkedin-audit-backend.YOUR-SUBDOMAIN.workers.dev';

// TODO: Replace with your actual Razorpay public key (test or live)
// The secret key must NEVER appear here — it lives in Cloudflare Workers secrets only.
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID';

const ackCheckbox = document.getElementById('ack');
const payBtn = document.getElementById('pay-btn');
const postPayMsg = document.getElementById('post-pay-msg');

ackCheckbox.addEventListener('change', () => {
  payBtn.disabled = !ackCheckbox.checked;
});

payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  payBtn.textContent = 'Creating order…';

  try {
    const response = await fetch(`${BACKEND_URL}/create-order`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Server error ${response.status}`);
    }
    const order = await response.json();

    const rzp = new Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'LinkedIn Profile Booster',
      description: 'One-time license — ₹200',
      theme: { color: '#0a5c9e' },
      handler: () => {
        payBtn.hidden = true;
        postPayMsg.hidden = false;
      },
      modal: {
        ondismiss: () => {
          payBtn.disabled = false;
          payBtn.textContent = 'Pay ₹200 →';
        },
      },
    });

    rzp.open();
  } catch (err) {
    alert(`Could not start payment: ${String(err)}`);
    payBtn.disabled = false;
    payBtn.textContent = 'Pay ₹200 →';
  }
});
