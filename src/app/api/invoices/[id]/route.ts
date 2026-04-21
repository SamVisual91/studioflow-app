import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canViewProjectFinancials } from "@/lib/roles";

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

function parseLineItems(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as LineItem[];
  }

  return input
    .map((item) => ({
      title: String((item as LineItem).title || "").trim(),
      description: String((item as LineItem).description || "").trim(),
      image: String((item as LineItem).image || "").trim(),
      amount: Number((item as LineItem).amount || 0),
    }))
    .filter((item) => item.title && !Number.isNaN(item.amount));
}

function parsePaymentSchedule(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as PaymentScheduleItem[];
  }

  return input
    .map((item) => ({
      id: String((item as PaymentScheduleItem).id || "").trim(),
      amount: Number((item as PaymentScheduleItem).amount || 0),
      dueDate: String((item as PaymentScheduleItem).dueDate || "").trim(),
      status: String((item as PaymentScheduleItem).status || "UPCOMING").trim(),
      invoiceNumber: String((item as PaymentScheduleItem).invoiceNumber || "").trim(),
    }))
    .filter((item) => item.id && item.dueDate && !Number.isNaN(item.amount));
}

function getInvoiceStatusFromSchedule(schedule: PaymentScheduleItem[]) {
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

function paymentScheduleMatchesAmount(amount: number, schedule: PaymentScheduleItem[]) {
  const scheduledTotal = Math.round(
    schedule.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100
  );
  const invoiceTotal = Math.round(Number(amount || 0) * 100);

  return scheduledTotal === invoiceTotal;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canViewProjectFinancials(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const projectId = String(body.projectId || "").trim();
  const label = String(body.label || "").trim();
  const dueDate = String(body.dueDate || "").trim();
  const method = String(body.method || "").trim();
  const taxRate = Number(body.taxRate || 0);
  const lineItems = parseLineItems(body.lineItems);
  const paymentSchedule = parsePaymentSchedule(body.paymentSchedule);
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = Math.round(subtotal * (Number.isNaN(taxRate) ? 0 : taxRate)) / 100;
  const amount = subtotal + taxAmount;
  const status = getInvoiceStatusFromSchedule(paymentSchedule);

  if (
    !id ||
    !projectId ||
    !label ||
    !dueDate ||
    !method ||
    !status ||
    Number.isNaN(taxRate) ||
    lineItems.length === 0 ||
    paymentSchedule.length === 0 ||
    Number.isNaN(amount) ||
    !paymentScheduleMatchesAmount(amount, paymentSchedule)
  ) {
    return NextResponse.json({ error: "Invalid invoice payload" }, { status: 400 });
  }

  const db = getDb();
  const timestamp = new Date().toISOString();

  db.prepare(
    "UPDATE invoices SET label = ?, status = ?, due_date = ?, amount = ?, method = ?, tax_rate = ?, line_items = ?, payment_schedule = ?, updated_at = ? WHERE id = ?"
  ).run(
    label,
    status,
    dueDate,
    amount,
    method,
    taxRate,
    JSON.stringify(lineItems),
    JSON.stringify(paymentSchedule),
    timestamp,
    id
  );

  db.prepare(
    "UPDATE project_files SET title = ?, summary = ?, body = ?, updated_at = ? WHERE project_id = ? AND type = 'INVOICE' AND linked_path = ?"
  ).run(
    label,
    `Invoice due ${dueDate}`,
    `Invoice: ${label}\nDue date: ${dueDate}\nMethod: ${method}\nTax rate: ${taxRate}%\n\nLine items:\n${lineItems
      .map((item) => `- ${item.title}: ${item.description} ($${item.amount})`)
      .join("\n")}\n\nPayment plan:\n${paymentSchedule
      .map((item) => `- ${item.invoiceNumber}: ${item.dueDate} - $${item.amount} (${item.status})`)
      .join("\n")}\n\nGrand total: $${amount}`,
    timestamp,
    projectId,
    `/projects/${projectId}/invoices/${id}`
  );

  const invoice = db
    .prepare("SELECT public_token FROM invoices WHERE id = ? LIMIT 1")
    .get(id) as { public_token?: string | null } | undefined;

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/overview");
  if (invoice?.public_token) {
    revalidatePath(`/invoice/${invoice.public_token}`);
  }

  return NextResponse.json({ ok: true });
}
