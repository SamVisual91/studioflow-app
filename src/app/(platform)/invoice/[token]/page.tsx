import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createStripeAutopaySetupAction,
  createStripeCheckoutAction,
  disableInvoiceAutopayAction,
  submitClientExternalPaymentAction,
} from "@/app/actions";
import { processInvoiceAutopay } from "@/lib/autopay";
import { getDb } from "@/lib/db";
import { currencyFormatter, shortDate } from "@/lib/formatters";
import { getPaymentOptions } from "@/lib/payment-options";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

type LineItem = {
  title: string;
  description: string;
  image?: string;
  amount: number;
};

type PaymentScheduleItem = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  invoiceNumber: string;
};

function getInstallmentLabel(index: number, total: number) {
  if (index === 0) {
    return "Retainer";
  }
  if (index === total - 1 && total > 1) {
    return "Final payment";
  }
  return `Payment ${index + 1}`;
}

function getUrgencyLabel(dueDate: string, status: string) {
  if (status === "PAID") {
    return "Paid";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return "Upcoming";
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays === 1) {
    return "Due tomorrow";
  }
  if (diffDays <= 3) {
    return `Due in ${diffDays} days`;
  }

  return "Upcoming";
}

function parseLineItems(value: unknown) {
  try {
    return JSON.parse(String(value ?? "[]")) as LineItem[];
  } catch {
    return [];
  }
}

function parsePaymentSchedule(value: unknown): PaymentScheduleItem[] {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (JSON.parse(String(value ?? "[]")) as Array<Record<string, unknown>>).map((item, index) => {
      const dueDate = String(item.dueDate || "").trim();
      const rawStatus = String(item.status || "").trim().toUpperCase();
      const due = dueDate ? new Date(`${dueDate}T00:00:00`) : null;

      return {
        id: String(item.id || ""),
        amount: Number(item.amount || 0),
        dueDate,
        invoiceNumber:
          String(item.invoiceNumber || "").trim() ||
          `#${String(item.id || "draft").slice(0, 6).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
        status:
          rawStatus === "PAID"
            ? "PAID"
            : due && !Number.isNaN(due.getTime()) && due.getTime() < today.getTime()
              ? "OVERDUE"
              : "UPCOMING",
      };
    });
  } catch {
    return [];
  }
}

function getNextInvoiceStatus(schedule: PaymentScheduleItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (schedule.every((item) => item.status === "PAID")) {
    return "PAID";
  }

  const hasOverdue = schedule.some((item) => {
    if (item.status === "PAID") {
      return false;
    }

    const due = new Date(`${item.dueDate}T00:00:00`);
    return !Number.isNaN(due.getTime()) && due.getTime() < today.getTime();
  });

  return hasOverdue ? "OVERDUE" : "DUE_SOON";
}

function normalizeMethod(method: string) {
  const value = method.trim().toLowerCase();

  if (!value || value === "multiple options") {
    return "multiple";
  }
  if (value.includes("stripe")) {
    return "stripe";
  }
  if (value.includes("venmo")) {
    return "venmo";
  }
  if (value.includes("bank") || value.includes("ach")) {
    return "bank";
  }
  if (value.includes("manual")) {
    return "manual";
  }

  return "multiple";
}

const statusTone: Record<string, string> = {
  PAID: "border-[rgba(47,125,92,0.34)] bg-[rgba(47,125,92,0.12)] text-[var(--forest)]",
  DUE_SOON: "border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]",
  OVERDUE: "border-[rgba(122,27,27,0.14)] bg-[rgba(122,27,27,0.08)] text-[rgb(122,27,27)]",
  UPCOMING: "border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]",
  PENDING: "border-[rgba(29,78,216,0.14)] bg-[rgba(29,78,216,0.08)] text-[rgb(29,78,216)]",
};

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    paid?: string;
    submitted?: string;
    session_id?: string;
    autopay_session_id?: string;
    canceled?: string;
    autopay_canceled?: string;
    autopay_disabled?: string;
    error?: string;
  }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const db = getDb();

  let invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    notFound();
  }

  await processInvoiceAutopay(String(invoice.id));
  invoice = db
    .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!invoice) {
    notFound();
  }

  if (query.autopay_session_id && hasStripeConfig()) {
    try {
      if (!invoice) {
        notFound();
      }
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(String(query.autopay_session_id));
      const setupIntentId = String(session.setup_intent || "");
      const customerId = String(session.customer || "");

      if (setupIntentId && customerId) {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        const paymentMethodId = String(setupIntent.payment_method || "");

        if (paymentMethodId) {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          db.prepare(
            "UPDATE invoices SET stripe_customer_id = ?, stripe_payment_method_id = ?, auto_pay_enabled = 1, auto_pay_last4 = ?, updated_at = ? WHERE id = ?"
          ).run(
            customerId,
            paymentMethodId,
            paymentMethod.card?.last4 || "",
            new Date().toISOString(),
            String(invoice.id)
          );

          invoice = db
            .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
            .get(token) as Record<string, unknown> | undefined;
        }
      }
    } catch {
      // Ignore setup retrieval failures and fall back to current invoice state.
    }
  }

  if (query.session_id && hasStripeConfig()) {
    try {
      if (!invoice) {
        notFound();
      }
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(String(query.session_id));
      const sessionPaymentId = String(session.metadata?.paymentId || "");

      if (session.payment_status === "paid" && sessionPaymentId) {
        const paymentSchedule = parsePaymentSchedule(invoice.payment_schedule);
        const nextPaymentSchedule = paymentSchedule.map((item) =>
          item.id === sessionPaymentId
            ? {
                ...item,
                status: "PAID",
              }
            : item
        );

        db.prepare("UPDATE invoices SET status = ?, payment_schedule = ?, updated_at = ? WHERE id = ?").run(
          getNextInvoiceStatus(nextPaymentSchedule),
          JSON.stringify(nextPaymentSchedule),
          new Date().toISOString(),
          String(invoice.id)
        );

        invoice = db
          .prepare("SELECT * FROM invoices WHERE public_token = ? LIMIT 1")
          .get(token) as Record<string, unknown> | undefined;
      }
    } catch {
      // Ignore retrieval failures and fall back to existing invoice state.
    }
  }

  if (!invoice) {
    notFound();
  }

  const clientName = String(invoice.client || "");
  const project = db
    .prepare("SELECT * FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1")
    .get(clientName) as Record<string, unknown> | undefined;
  const client = db
    .prepare("SELECT * FROM clients WHERE name = ? LIMIT 1")
    .get(clientName) as Record<string, unknown> | undefined;
  const packagePreset = client?.package_name
    ? ((db
        .prepare("SELECT * FROM package_presets WHERE name = ? LIMIT 1")
        .get(String(client.package_name)) as Record<string, unknown> | undefined) ??
      undefined)
    : undefined;

  const lineItems = parseLineItems(invoice.line_items);
  const paymentSchedule = parsePaymentSchedule(invoice.payment_schedule);
  const unpaidPayments = paymentSchedule.filter((item) => item.status !== "PAID");
  const taxRate = Number(invoice.tax_rate ?? 3);
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;
  const nextPayment = paymentSchedule.find((item) => item.status !== "PAID") || null;
  const paidAmount = paymentSchedule
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingAmount = Math.max(grandTotal - paidAmount, 0);
  const heroImage =
    String(packagePreset?.cover_image || "") ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80";
  const paymentOptions = getPaymentOptions();
  const stripeReady = hasStripeConfig();
  const selectedMethod = normalizeMethod(String(invoice.method || ""));
  const visiblePaymentOptions =
    selectedMethod === "multiple" || (selectedMethod === "stripe" && !stripeReady)
      ? paymentOptions
      : paymentOptions.filter((option) => option.id === selectedMethod);
  const showStripeButton = stripeReady && (selectedMethod === "multiple" || selectedMethod === "stripe");
  const autoPayEnabled = Number(invoice.auto_pay_enabled || 0) === 1;
  const autoPayLast4 = String(invoice.auto_pay_last4 || "").trim();

  const successMessage = query.submitted
    ? "Payment submitted successfully."
    : query.autopay_session_id
      ? "Auto-pay is enabled for this invoice."
      : query.autopay_disabled
        ? "Auto-pay has been turned off for this invoice."
        : query.session_id
          ? "Stripe payment completed successfully."
          : query.paid
            ? "Payment recorded successfully."
            : "";

  const errorMessage =
    query.error === "payment-invalid"
      ? "Choose a valid payment before submitting."
      : query.error === "stripe-missing"
        ? "Stripe is not configured yet for this invoice."
        : query.autopay_canceled
          ? "Auto-pay setup was canceled."
          : query.canceled
            ? "Stripe checkout was canceled."
            : "";

  async function handleStripeCheckout(formData: FormData) {
    "use server";
    await createStripeCheckoutAction(formData);
  }

  async function handleAutopaySetup(formData: FormData) {
    "use server";
    await createStripeAutopaySetupAction(formData);
  }

  async function handleAutopayDisable(formData: FormData) {
    "use server";
    await disableInvoiceAutopayAction(formData);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ef_0%,#f2ede6_52%,#f8f4ef_100%)] px-4 py-8 text-[var(--ink)] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--muted)]">StudioFlow private invoice</p>
            <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{String(invoice.label)}</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {clientName}
              {project?.name ? ` | ${String(project.name)}` : ""}
            </p>
          </div>
          <span
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              statusTone[String(invoice.status)] || "border-black/[0.08] bg-black/[0.06] text-[var(--muted)]"
            }`}
          >
            {String(invoice.status).replace("_", " ")}
          </span>
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-[1rem] border border-[rgba(47,125,92,0.18)] bg-[rgba(47,125,92,0.07)] px-5 py-4 text-sm text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-[1rem] border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.07)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-6">
          <div
            className="overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-cover bg-center shadow-[0_24px_64px_rgba(58,34,17,0.1)]"
            style={{ backgroundImage: `linear-gradient(90deg,rgba(23,19,18,0.58),rgba(23,19,18,0.18)), url(${heroImage})` }}
          >
            <div className="grid min-h-[16rem] items-end gap-6 bg-[linear-gradient(180deg,rgba(17,15,14,0.04),rgba(17,15,14,0.36))] px-6 py-6 text-white md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/72">Invoice overview</p>
                <h2 className="mt-3 font-display text-4xl leading-none md:text-5xl">
                  {project?.name ? String(project.name) : clientName}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/84">
                  Review your invoice, choose the installment you want to pay, and complete checkout securely from this page.
                </p>
              </div>
              <div className="grid gap-3 self-start md:justify-self-end">
                <div className="rounded-[1.1rem] border border-white/16 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/68">Due date</p>
                  <p className="mt-2 text-xl font-semibold">{shortDate.format(new Date(String(invoice.due_date)))}</p>
                </div>
                <div className="rounded-[1.1rem] border border-white/16 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/68">Balance due</p>
                  <p className="mt-2 text-xl font-semibold">{currencyFormatter.format(remainingAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <article className="rounded-[1.5rem] border border-black/[0.06] bg-white/90 p-6 shadow-[0_18px_40px_rgba(58,34,17,0.06)]">
              <div className="grid gap-4 border-b border-black/[0.08] pb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)] md:grid-cols-[1.8fr_0.6fr_0.7fr]">
                <p>Items</p>
                <p>Price</p>
                <p>Total</p>
              </div>

              <div className="grid gap-4 pt-6">
                {lineItems.map((item, index) => (
                  <div
                    key={`${String(invoice.id)}-${index}`}
                    className="grid gap-4 border-b border-black/[0.05] pb-4 last:border-b-0 last:pb-0 md:grid-cols-[1.8fr_0.6fr_0.7fr] md:items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 rounded-[1rem] border border-black/[0.05] bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image || heroImage})` }}
                      />
                      <div>
                        <p className="text-base font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{currencyFormatter.format(Number(item.amount || 0))}</p>
                    <p className="text-base font-semibold">{currencyFormatter.format(Number(item.amount || 0))}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 ml-auto max-w-sm border-t border-black/[0.08] pt-5 text-sm">
                <div className="flex items-center justify-between py-3 text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span>{currencyFormatter.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-3 text-[var(--muted)]">
                  <span>Tax {taxRate}%</span>
                  <span>{currencyFormatter.format(taxAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-black/[0.14] pt-4 text-2xl font-semibold">
                  <span>Grand Total</span>
                  <span>{currencyFormatter.format(grandTotal)}</span>
                </div>
              </div>
            </article>

            <div className="grid gap-6">
              <article
                className="rounded-[1.5rem] border border-black/[0.06] bg-white/90 p-6 shadow-[0_18px_40px_rgba(58,34,17,0.06)]"
                id="payment-options"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Payment</p>
                <h2 className="mt-3 text-2xl font-semibold">Make a payment</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Use the next scheduled payment below. Once submitted, the invoice will update right away.
                </p>

                {showStripeButton ? (
                  <div className="mt-5 rounded-[1.1rem] border border-black/[0.06] bg-[rgba(250,247,243,0.92)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Auto-pay</p>
                        <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                          {autoPayEnabled ? "Enabled" : "Available"}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {autoPayEnabled
                            ? `Card ending in ${autoPayLast4 || "saved last 4"} is ready for future payments.`
                            : "Save a card for future installments with Stripe auto-pay."}
                        </p>
                      </div>

                      {autoPayEnabled ? (
                        <form action={handleAutopayDisable}>
                          <input name="token" type="hidden" value={token} />
                          <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                            Turn off
                          </button>
                        </form>
                      ) : (
                        <form action={handleAutopaySetup}>
                          <input name="token" type="hidden" value={token} />
                          <button className="rounded-full border border-[var(--forest)] bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.06)]">
                            Set up auto-pay
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : null}

                {nextPayment ? (
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-[1.2rem] border border-black/[0.06] bg-[rgba(247,241,232,0.72)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Next payment</p>
                          <p className="mt-3 text-3xl font-semibold">{currencyFormatter.format(nextPayment.amount)}</p>
                          <p className="mt-2 text-sm text-[var(--muted)]">Due {shortDate.format(new Date(nextPayment.dueDate))}</p>
                        </div>
                        <div className="min-w-[10rem] text-right">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Remaining total</p>
                          <p className="mt-3 text-2xl font-semibold">{currencyFormatter.format(remainingAmount)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[rgba(207,114,79,0.14)] bg-[rgba(207,114,79,0.08)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          {getUrgencyLabel(nextPayment.dueDate, nextPayment.status)}
                        </span>
                        <span className="rounded-full border border-black/[0.06] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                          {getInstallmentLabel(paymentSchedule.findIndex((item) => item.id === nextPayment.id), paymentSchedule.length)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted)]">Reference {nextPayment.invoiceNumber}</p>
                    </div>

                    {showStripeButton ? (
                      <form
                        action={handleStripeCheckout}
                        className="grid gap-4 rounded-[1.2rem] border border-black/[0.06] bg-[rgba(250,247,243,0.92)] p-4"
                      >
                        <input name="token" type="hidden" value={token} />
                        <div className="grid gap-2">
                          <label className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]" htmlFor="paymentId">
                            Choose amount to pay
                          </label>
                          <select
                            className="rounded-[0.95rem] border border-black/[0.08] bg-white px-4 py-3 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                            defaultValue={nextPayment.id}
                            id="paymentId"
                            name="paymentId"
                          >
                            {unpaidPayments.map((item, index) => (
                              <option key={item.id} value={item.id}>
                                {getInstallmentLabel(index, unpaidPayments.length)} | {currencyFormatter.format(item.amount)} | {getUrgencyLabel(item.dueDate, item.status)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="rounded-[0.95rem] border border-black/[0.06] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                          Secure checkout. Card details are entered on Stripe&apos;s payment page.
                        </div>

                        <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,125,92,0.22)] transition hover:brightness-110">
                          Pay now
                        </button>
                      </form>
                    ) : null}

                    {visiblePaymentOptions.length > 0 ? (
                      <div className="grid gap-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Manual payment options</p>
                        {visiblePaymentOptions.map((option) => (
                          <div key={option.id} className="rounded-[1.1rem] border border-black/[0.06] bg-[rgba(250,247,243,0.92)] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{option.label}</p>
                                <p className="mt-1 text-sm text-[var(--muted)]">{option.description}</p>
                                {option.detail ? (
                                  <p className="mt-2 text-sm font-medium text-[var(--ink)]">{option.detail}</p>
                                ) : null}
                              </div>
                              {option.href ? (
                                <Link
                                  className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                                  href={option.href}
                                  target="_blank"
                                >
                                  Pay with {option.label}
                                </Link>
                              ) : null}
                            </div>

                            <form action={submitClientExternalPaymentAction} className="mt-4 grid gap-3">
                              <input name="token" type="hidden" value={token} />
                              <input name="paymentId" type="hidden" value={nextPayment.id} />
                              <input name="paymentMethod" type="hidden" value={option.label} />
                              <button className="rounded-full border border-black/[0.08] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                                Confirm payment sent via {option.label}
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {!showStripeButton && visiblePaymentOptions.length === 0 && selectedMethod !== "manual" ? (
                      <div className="rounded-[1.1rem] border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.07)] p-4 text-sm text-[var(--accent)]">
                        This invoice is set to <strong>{String(invoice.method)}</strong>, but that payment option is not configured yet.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.1rem] border border-[rgba(47,125,92,0.14)] bg-[rgba(47,125,92,0.08)] p-4 text-sm text-[var(--forest)]">
                    This invoice has been fully paid.
                  </div>
                )}
              </article>

              <article className="rounded-[1.5rem] border border-black/[0.06] bg-white/90 p-6 shadow-[0_18px_40px_rgba(58,34,17,0.06)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Payment schedule</p>
                <div className="mt-5 grid gap-3">
                  {paymentSchedule.map((item) => (
                    <div key={item.id} className="rounded-[1.1rem] border border-black/[0.06] bg-[rgba(250,247,243,0.92)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                            {getInstallmentLabel(paymentSchedule.findIndex((entry) => entry.id === item.id), paymentSchedule.length)}
                          </p>
                          <p className="font-semibold">{currencyFormatter.format(item.amount)}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{shortDate.format(new Date(item.dueDate))}</p>
                          <p className="mt-2 text-sm text-[var(--muted)]">{item.invoiceNumber}</p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                            statusTone[item.status] || "border-black/[0.08] bg-black/[0.06] text-[var(--muted)]"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              {project?.public_portal_token ? (
                <Link
                  className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  href={`/client-portal/${String(project.public_portal_token)}?tab=financials`}
                >
                  Return to client portal
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {nextPayment ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(58,34,17,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                {getUrgencyLabel(nextPayment.dueDate, nextPayment.status)}
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{currencyFormatter.format(nextPayment.amount)}</p>
            </div>

            {showStripeButton ? (
              <form action={handleStripeCheckout}>
                <input name="token" type="hidden" value={token} />
                <input name="paymentId" type="hidden" value={nextPayment.id} />
                <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                  Pay now
                </button>
              </form>
            ) : (
              <a
                className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                href="#payment-options"
              >
                Pay now
              </a>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
