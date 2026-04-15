import { redirect } from "next/navigation";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { getVideoPaywallByToken, markVideoPaywallPaid } from "@/lib/video-paywalls";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const paywall = getVideoPaywallByToken(token);

  if (!paywall) {
    redirect(`/video-paywall/${token}?error=payment-invalid`);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || "";

  if (sessionId && hasStripeConfig()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const sessionPaywallId = String(session.metadata?.paywallId || "");

      if (session.payment_status === "paid" && sessionPaywallId === paywall.id) {
        markVideoPaywallPaid({
          paywallId: paywall.id,
          sessionId: session.id,
          buyerEmail: session.customer_details?.email || "",
          paidAt: new Date().toISOString(),
        });
      }
    } catch {
      redirect(`/video-paywall/${token}?error=payment-invalid`);
    }
  }

  const latestPaywall = getVideoPaywallByToken(token);

  if (latestPaywall?.status !== "PAID") {
    redirect(`/video-paywall/${token}?error=payment-required`);
  }

  redirect(latestPaywall.synology_download_url);
}
