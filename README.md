# Moscatelli Official

Static Moscatelli storefront deployed on Netlify, with a test-mode Stripe checkout handled by a Netlify Function.

## Local setup

1. Install dependencies with `npm ci`.
2. Install the Netlify CLI with `npm install --global netlify-cli` if needed.
3. Create a local `.env` file containing `STRIPE_SECRET_KEY=sk_test_...`.
4. Run `netlify dev`.

Never commit `.env` files or Stripe secret keys. The Stripe publishable test key in `pagamento.html` is intended for browser use; the secret key must stay in Netlify's environment variables.

## Netlify configuration

- Publish directory: repository root (`.`)
- Functions directory: `netlify/functions`
- Required environment variable: `STRIPE_SECRET_KEY`

## Current commerce status

The checkout currently uses Stripe test mode. Shopify is not integrated in this recovered deployment. Before accepting real orders, the product, inventory, shipping, order creation, tax, fulfillment, confirmation email, webhook, and refund flows need to be designed and tested.
