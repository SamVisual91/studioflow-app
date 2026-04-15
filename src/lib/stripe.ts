import Stripe from "stripe";

function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasStripeConfig() {
  return Boolean(getRequired("STRIPE_SECRET_KEY"));
}

export function hasStripeWebhookSecret() {
  return Boolean(getRequired("STRIPE_WEBHOOK_SECRET"));
}

export function getStripeWebhookSecret() {
  return getRequired("STRIPE_WEBHOOK_SECRET");
}

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!hasStripeConfig()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(getRequired("STRIPE_SECRET_KEY"));
  }

  return stripeInstance;
}
