import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { resolveProjectForInvoice } from "@/lib/invoice-project";
import { recordInvoicePaymentToLedger } from "@/lib/ledger";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

type PaymentScheduleItem = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  invoiceNumber: string;
};

function parsePaymentSchedule(value: unknown): PaymentScheduleItem[] {
  try {
    return JSON.parse(String(value ?? "[]")) as PaymentScheduleItem[];
  } catch {
    return [];
  }
}

function createRecentActivity(label: string, timestamp: string) {
  return `${label} on ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function logProjectMessage(input: {
  sender: string;
  clientName: string;
  projectId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  time: string;
  subject: string;
  preview: string;
  unread: number;
}) {
  const db = getDb();
  db.prepare(
    "INSERT INTO messages (id, sender, client_name, project_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    input.sender,
    input.clientName,
    input.projectId,
    input.direction,
    input.channel,
    input.time,
    input.subject,
    input.preview,
    input.unread,
    input.time,
    input.time
  );
}

function updateProjectRecentActivity(projectId: string, recentActivity: string, timestamp: string) {
  const db = getDb();
  db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
    recentActivity,
    timestamp,
    projectId
  );
}

export function getNextInvoiceStatus(schedule: PaymentScheduleItem[]) {
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

export function updateInvoiceAutopaySetup(invoiceId: string, customerId: string, paymentMethodId: string, last4: string) {
  const db = getDb();
  db.prepare(
    "UPDATE invoices SET stripe_customer_id = ?, stripe_payment_method_id = ?, auto_pay_enabled = 1, auto_pay_last4 = ?, updated_at = ? WHERE id = ?"
  ).run(customerId, paymentMethodId, last4, new Date().toISOString(), invoiceId);
}

export function markInvoicePaymentPaid(
  invoiceId: string,
  paymentId: string,
  opts?: { channel?: string; preview?: string; activity?: string }
) {
  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1")
    .get(invoiceId) as Record<string, unknown> | undefined;

  if (!invoice) {
    return;
  }

  const paymentSchedule = parsePaymentSchedule(invoice.payment_schedule);
  const nextSchedule = paymentSchedule.map((item) =>
    item.id === paymentId
      ? {
          ...item,
          status: "PAID",
        }
      : item
  );

  if (!nextSchedule.some((item) => item.id === paymentId)) {
    return;
  }

  const timestamp = new Date().toISOString();
  db.prepare("UPDATE invoices SET status = ?, payment_schedule = ?, updated_at = ? WHERE id = ?").run(
    getNextInvoiceStatus(nextSchedule),
    JSON.stringify(nextSchedule),
    timestamp,
    invoiceId
  );
  const paidItem = nextSchedule.find((item) => item.id === paymentId);

  if (paidItem) {
    recordInvoicePaymentToLedger({
      invoiceId,
      paymentId,
      paymentAmount: Number(paidItem.amount || 0),
      paymentDate: timestamp,
      paymentMethod: opts?.channel === "Auto-pay" || opts?.channel === "Stripe webhook" ? "Stripe" : String(invoice.method || ""),
      invoiceLabel: String(invoice.label || ""),
      invoiceNumber: String(paidItem.invoiceNumber || ""),
      clientName: String(invoice.client || ""),
      sourceType: opts?.channel === "Auto-pay" ? "AUTOPAY_PAYMENT" : "STRIPE_PAYMENT",
    });
  }

  const project = resolveProjectForInvoice(invoice, db);

  if (project) {
    logProjectMessage({
      sender: opts?.channel === "Auto-pay" ? "StudioFlow Auto-pay" : String(invoice.client),
      clientName: project.client,
      projectId: project.id,
      direction: "INBOUND",
      channel: opts?.channel || "Portal payment",
      time: timestamp,
      subject: String(invoice.label),
      preview: opts?.preview || "A payment was submitted from the client invoice page.",
      unread: 1,
    });
    updateProjectRecentActivity(
      project.id,
      createRecentActivity(opts?.activity || "Client payment received", timestamp),
      timestamp
    );
  }
}

export function markInvoiceAutopayFailure(invoiceId: string, paymentId: string) {
  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1")
    .get(invoiceId) as Record<string, unknown> | undefined;

  if (!invoice) {
    return;
  }

  const paymentSchedule = parsePaymentSchedule(invoice.payment_schedule);
  db.prepare("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?").run(
    getNextInvoiceStatus(paymentSchedule),
    new Date().toISOString(),
    invoiceId
  );

  const project = resolveProjectForInvoice(invoice, db);

  if (project) {
    const failedPayment = paymentSchedule.find((item) => item.id === paymentId);
    const timestamp = new Date().toISOString();
    logProjectMessage({
      sender: "StudioFlow Auto-pay",
      clientName: project.client,
      projectId: project.id,
      direction: "INBOUND",
      channel: "Auto-pay",
      time: timestamp,
      subject: String(invoice.label),
      preview: `Auto-pay failed for ${failedPayment?.invoiceNumber || "a scheduled payment"}. Follow-up may be needed.`,
      unread: 1,
    });
    updateProjectRecentActivity(
      project.id,
      createRecentActivity("Auto-pay failed", timestamp),
      timestamp
    );
  }
}

export async function processInvoiceAutopay(invoiceId: string) {
  if (!hasStripeConfig()) {
    return;
  }

  const db = getDb();
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1")
    .get(invoiceId) as Record<string, unknown> | undefined;

  if (!invoice || Number(invoice.auto_pay_enabled || 0) !== 1) {
    return;
  }

  const stripeCustomerId = String(invoice.stripe_customer_id || "").trim();
  const stripePaymentMethodId = String(invoice.stripe_payment_method_id || "").trim();

  if (!stripeCustomerId || !stripePaymentMethodId) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paymentSchedule = parsePaymentSchedule(invoice.payment_schedule);
  const duePayments = paymentSchedule.filter((item) => {
    if (item.status === "PAID") {
      return false;
    }
    const due = new Date(`${item.dueDate}T00:00:00`);
    return !Number.isNaN(due.getTime()) && due.getTime() <= today.getTime();
  });

  if (duePayments.length === 0) {
    db.prepare("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?").run(
      getNextInvoiceStatus(paymentSchedule),
      new Date().toISOString(),
      invoiceId
    );
    return;
  }

  const stripe = getStripe();

  for (const payment of duePayments) {
    const latestInvoice = db
      .prepare("SELECT payment_schedule FROM invoices WHERE id = ? LIMIT 1")
      .get(invoiceId) as { payment_schedule?: string } | undefined;
    const latestSchedule = parsePaymentSchedule(latestInvoice?.payment_schedule);
    const stillUnpaid = latestSchedule.find((item) => item.id === payment.id && item.status !== "PAID");

    if (!stillUnpaid) {
      continue;
    }

    try {
      await stripe.paymentIntents.create({
        amount: Math.round(Number(payment.amount || 0) * 100),
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: stripePaymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          invoiceId,
          paymentId: payment.id,
          mode: "autopay",
        },
      });

      markInvoicePaymentPaid(invoiceId, payment.id, {
        channel: "Auto-pay",
        preview: `Auto-pay processed ${payment.invoiceNumber} successfully.`,
        activity: "Auto-pay charge received",
      });
    } catch {
      markInvoiceAutopayFailure(invoiceId, payment.id);
      break;
    }
  }
}

export async function processAllAutopayInvoices() {
  const db = getDb();
  const invoices = db
    .prepare("SELECT id FROM invoices WHERE auto_pay_enabled = 1")
    .all() as Array<{ id: string }>;

  for (const invoice of invoices) {
    await processInvoiceAutopay(invoice.id);
  }

  return invoices.length;
}
