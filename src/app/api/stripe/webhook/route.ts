import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  markInvoiceAutopayFailure,
  markInvoicePaymentPaid,
  updateInvoiceAutopaySetup,
} from "@/lib/autopay";
import { getStripe, getStripeWebhookSecret, hasStripeConfig, hasStripeWebhookSecret } from "@/lib/stripe";
import { markVideoPaywallPaid } from "@/lib/video-paywalls";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasStripeConfig() || !hasStripeWebhookSecret()) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const mode = String(session.mode || "");
      const invoiceId = String(session.metadata?.invoiceId || "");
      const paymentId = String(session.metadata?.paymentId || "");
      const token = String(session.metadata?.token || "");
      const paywallId = String(session.metadata?.paywallId || "");
      const projectId = String(session.metadata?.projectId || "");
      const productType = String(session.metadata?.productType || "");

      if (mode === "setup") {
        const setupIntentId = String(session.setup_intent || "");
        const customerId = String(session.customer || "");
        if (setupIntentId && customerId && invoiceId) {
          const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
          const paymentMethodId = String(setupIntent.payment_method || "");
          if (paymentMethodId) {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            updateInvoiceAutopaySetup(invoiceId, customerId, paymentMethodId, paymentMethod.card?.last4 || "");
            revalidatePath("/ledger");
          }
        }
      }

      if (mode === "payment" && invoiceId && paymentId) {
        markInvoicePaymentPaid(invoiceId, paymentId, {
          channel: "Stripe webhook",
          preview: `Stripe confirmed payment for ${paymentId}.`,
          activity: "Stripe payment received",
        });
        revalidatePath("/ledger");
      }

      if (mode === "payment" && productType === "video-paywall" && paywallId) {
        markVideoPaywallPaid({
          paywallId,
          sessionId: session.id,
          buyerEmail: session.customer_details?.email || "",
          paidAt: new Date().toISOString(),
        });
        revalidatePath("/ledger");
        revalidatePath("/overview");
        if (token) {
          revalidatePath(`/video-paywall/${token}`);
        }
        if (projectId) {
          revalidatePath(`/projects/${projectId}`);
        }
      }

      return NextResponse.json({ received: true, token });
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = String(intent.metadata?.invoiceId || "");
      const paymentId = String(intent.metadata?.paymentId || "");
      const mode = String(intent.metadata?.mode || "");

      if (invoiceId && paymentId && mode === "autopay") {
        markInvoicePaymentPaid(invoiceId, paymentId, {
          channel: "Auto-pay",
          preview: `Auto-pay processed ${paymentId} successfully.`,
          activity: "Auto-pay charge received",
        });
        revalidatePath("/ledger");
      }

      return NextResponse.json({ received: true });
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = String(intent.metadata?.invoiceId || "");
      const paymentId = String(intent.metadata?.paymentId || "");
      const mode = String(intent.metadata?.mode || "");

      if (invoiceId && paymentId && mode === "autopay") {
        markInvoiceAutopayFailure(invoiceId, paymentId);
        revalidatePath("/ledger");
      }

      return NextResponse.json({ received: true });
    }

    default:
      return NextResponse.json({ received: true });
  }
}
