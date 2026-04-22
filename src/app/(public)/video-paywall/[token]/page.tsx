import Link from "next/link";
import { notFound } from "next/navigation";
import { createVideoPaywallCheckoutAction } from "@/app/actions";
import { getDb } from "@/lib/db";
import { currencyFormatter, dateTime } from "@/lib/formatters";
import { hasStripeConfig } from "@/lib/stripe";
import { ensureVideoPaywallsTable } from "@/lib/video-paywalls";

export default async function VideoPaywallPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ canceled?: string; error?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  ensureVideoPaywallsTable();
  const paywall = db
    .prepare(
      `SELECT video_paywalls.*, projects.client, projects.name AS project_name
       FROM video_paywalls
       JOIN projects ON projects.id = video_paywalls.project_id
       WHERE video_paywalls.public_token = ?
       LIMIT 1`
    )
    .get(token) as
    | {
        id: string;
        title: string;
        description: string;
        price: number;
        cover_image?: string | null;
        public_token: string;
        status: string;
        purchased_at?: string | null;
        buyer_email?: string | null;
        client: string;
        project_name: string;
      }
    | undefined;

  if (!paywall) {
    notFound();
  }

  async function handleCheckout(formData: FormData) {
    "use server";
    await createVideoPaywallCheckoutAction(formData);
  }

  const stripeReady = hasStripeConfig();
  const isPaid = paywall.status === "PAID";
  const coverImage =
    paywall.cover_image ||
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80";

  const message =
    query.error === "stripe-missing"
      ? "Stripe is not configured yet, so this video cannot be purchased online."
      : query.error === "payment-invalid"
        ? "The payment could not be started. Please contact us for help."
        : query.error === "payment-required"
          ? "Payment is required before the download can be unlocked."
        : query.canceled
          ? "Checkout was canceled. You can restart the purchase anytime."
          : "";

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_28px_80px_rgba(58,34,17,0.12)]">
          <div
            className="min-h-[22rem] bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(90deg, rgba(20,18,16,0.72), rgba(20,18,16,0.18)), url(${coverImage})` }}
          >
            <div className="flex min-h-[22rem] max-w-3xl flex-col justify-end px-8 py-10 text-white sm:px-12">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">Private video download</p>
              <h1 className="mt-4 font-display text-6xl leading-none">{paywall.title}</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/78">{paywall.description}</p>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-8">
            <article className="rounded-[1.5rem] border border-black/[0.06] bg-[rgba(250,247,243,0.78)] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Video package</p>
              <h2 className="mt-3 text-2xl font-semibold">{paywall.project_name}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This is a private paid download for {paywall.client}. After payment, you will be redirected to the secure download link.
              </p>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <span className="text-[var(--muted)]">Video</span>
                  <span className="font-semibold">{paywall.title}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <span className="text-[var(--muted)]">Delivery</span>
                  <span className="font-semibold">Synology download unlock</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Total</span>
                  <span className="text-2xl font-semibold">{currencyFormatter.format(Number(paywall.price || 0))}</span>
                </div>
              </div>
            </article>

            <aside className="rounded-[1.5rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Checkout</p>
              {message ? (
                <div className="mt-4 rounded-[1rem] border border-[rgba(207,114,79,0.22)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
                  {message}
                </div>
              ) : null}

              {isPaid ? (
                <div className="mt-5 grid gap-4">
                  <div className="rounded-[1rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-4 text-sm text-[var(--forest)]">
                    Paid and unlocked
                    {paywall.purchased_at ? ` on ${dateTime.format(new Date(paywall.purchased_at))}` : ""}.
                  </div>
                  <Link
                    className="rounded-full bg-[var(--forest)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
                    href={`/video-paywall/${paywall.public_token}/download`}
                  >
                    Download video
                  </Link>
                </div>
              ) : stripeReady ? (
                <form action={handleCheckout} className="mt-5 grid gap-4">
                  <input name="token" type="hidden" value={paywall.public_token} />
                  <div className="rounded-[1rem] bg-[rgba(247,241,232,0.72)] px-4 py-4">
                    <p className="text-sm text-[var(--muted)]">Amount due</p>
                    <p className="mt-2 text-3xl font-semibold">{currencyFormatter.format(Number(paywall.price || 0))}</p>
                  </div>
                  <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,125,92,0.22)] transition hover:brightness-110">
                    Buy video
                  </button>
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Card details are entered securely through Stripe. The download unlocks immediately after payment.
                  </p>
                </form>
              ) : (
                <div className="mt-5 rounded-[1rem] border border-[rgba(207,114,79,0.22)] bg-[rgba(207,114,79,0.08)] px-4 py-4 text-sm leading-6 text-[var(--accent)]">
                  Stripe is not configured yet. Please contact us to purchase this video.
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
