/**
 * Netlify Function — create-payment-intent.js
 *
 * Creates a Stripe PaymentIntent server-side and returns the clientSecret
 * to the payment page. This keeps the secret Stripe key off the browser.
 *
 * SETUP:
 * 1. Add STRIPE_SECRET_KEY to your Netlify environment variables
 *    (Netlify dashboard → Site → Environment variables)
 *    Use sk_test_... for test mode, sk_live_... for live mode.
 *
 * 2. Install Stripe in your project:
 *    npm install stripe
 *
 * 3. Deploy — Netlify auto-deploys functions in the /netlify/functions folder.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const BASE_PRICE_CENTS = 35000;
const VARIANTS = Object.freeze({
  'bianco-avorio': 'Bianco Avorio',
  'terra-bruna': 'Terra Bruna',
});
const SHIPPING_RATES_CENTS = Object.freeze({
  IT: 1200,
  CH: 1800,
  FR: 1800,
  DE: 1800,
  GB: 2200,
  US: 2800,
  BR: 3200,
  JP: 2800,
  AU: 2800,
});

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { country, variant = 'bianco-avorio' } = JSON.parse(event.body || '{}');
    const shippingCents = SHIPPING_RATES_CENTS[country];
    const variantName = VARIANTS[variant];

    if (shippingCents === undefined) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'Unsupported shipping country' }),
      };
    }

    if (!variantName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'Unsupported product variant' }),
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      // Price and shipping are calculated here, never accepted from the browser.
      amount:      BASE_PRICE_CENTS + shippingCents,
      currency:    'eur',
      description: `Moscatelli — Lotto I, Sciarpa Baby Alpaca, ${variantName}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        product:    'Lotto I — Sciarpa Baby Alpaca',
        collection: variantName,
        maison:     'Moscatelli',
        shipping_country: country,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'Unable to initialize payment' }),
    };
  }
};
