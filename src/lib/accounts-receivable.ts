import { getDb, parseJsonList } from "@/lib/db";

type PaymentScheduleRow = {
  id?: string;
  amount?: number;
  dueDate?: string;
  status?: string;
  invoiceNumber?: string;
};

type InvoiceRow = {
  id: string;
  client: string;
  label: string;
  status: string;
  due_date: string;
  amount: number;
  method: string;
  payment_schedule: string | null;
};

type ProjectRow = {
  id: string;
  client: string;
  name: string;
  project_type: string | null;
};

export type AccountsReceivableRow = {
  id: string;
  invoiceId: string;
  client: string;
  projectName: string;
  projectType: string;
  invoiceLabel: string;
  invoiceNumber: string;
  paymentNumber: number;
  dueDate: string;
  status: string;
  method: string;
  amount: number;
  paid: number;
  outstanding: number;
  months: number[];
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function safeDate(input: string) {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toMoney(value: number) {
  return Math.round((Number.isNaN(value) ? 0 : value) * 100) / 100;
}

function getPaymentStatus(payment: PaymentScheduleRow, today = new Date()) {
  const status = String(payment.status || "").toUpperCase();

  if (status === "PAID") {
    return "Paid";
  }

  const dueDate = safeDate(String(payment.dueDate || today.toISOString()));
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  if (startOfDueDate.getTime() < startOfToday.getTime()) {
    return "Overdue";
  }

  return "Upcoming";
}

function parsePaymentSchedule(invoice: InvoiceRow): PaymentScheduleRow[] {
  const parsed = parseJsonList(String(invoice.payment_schedule || "[]")) as unknown as PaymentScheduleRow[];

  if (parsed.length > 0) {
    return parsed;
  }

  return [
    {
      id: "single-payment",
      amount: Number(invoice.amount || 0),
      dueDate: String(invoice.due_date || new Date().toISOString()),
      status: invoice.status === "PAID" ? "PAID" : "UPCOMING",
      invoiceNumber: invoice.label || "Invoice",
    },
  ];
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

export function getAccountsReceivableData() {
  const db = getDb();
  const invoices = db.prepare("SELECT * FROM invoices ORDER BY due_date ASC").all() as InvoiceRow[];
  const projects = db.prepare("SELECT id, client, name, project_type FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
  const projectByClient = new Map(projects.map((project) => [project.client, project]));

  const rows: AccountsReceivableRow[] = invoices.flatMap((invoice) => {
    const project = projectByClient.get(invoice.client);

    return parsePaymentSchedule(invoice).map((payment, index) => {
      const amount = toMoney(Number(payment.amount || 0));
      const status = getPaymentStatus(payment);
      const paid = status === "Paid" ? amount : 0;
      const outstanding = status === "Paid" ? 0 : amount;
      const dueDate = safeDate(String(payment.dueDate || invoice.due_date));
      const months = Array.from({ length: 12 }, (_, monthIndex) => (dueDate.getMonth() === monthIndex ? outstanding : 0));

      return {
        id: `${invoice.id}:${payment.id || index}`,
        invoiceId: invoice.id,
        client: invoice.client,
        projectName: project?.name || invoice.label,
        projectType: project?.project_type || "",
        invoiceLabel: invoice.label,
        invoiceNumber: payment.invoiceNumber || invoice.label,
        paymentNumber: index + 1,
        dueDate: dueDate.toISOString(),
        status,
        method: invoice.method,
        amount,
        paid,
        outstanding,
        months,
      };
    });
  });

  const openRows = rows.filter((row) => row.status !== "Paid");
  const overdueRows = rows.filter((row) => row.status === "Overdue");
  const paidRows = rows.filter((row) => row.status === "Paid");
  const monthTotals = Array.from({ length: 12 }, (_, index) =>
    toMoney(rows.reduce((sum, row) => sum + Number(row.months[index] || 0), 0))
  );
  const clientSummaries = Array.from(
    rows.reduce<Map<string, AccountsReceivableRow[]>>((grouped, row) => {
      const clientRows = grouped.get(row.client) || [];
      clientRows.push(row);
      grouped.set(row.client, clientRows);
      return grouped;
    }, new Map())
  )
    .map(([client, clientRows]) => {
      const openClientRows = clientRows.filter((row) => row.status !== "Paid");
      const overdueClientRows = clientRows.filter((row) => row.status === "Overdue");
      const nextPayment = openClientRows
        .slice()
        .sort((a, b) => safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime())[0];

      return {
        id: encodeURIComponent(client),
        client,
        projectName: clientRows[0]?.projectName || "",
        projectType: clientRows[0]?.projectType || "",
        billed: toMoney(clientRows.reduce((sum, row) => sum + row.amount, 0)),
        paid: toMoney(clientRows.reduce((sum, row) => sum + row.paid, 0)),
        outstanding: toMoney(openClientRows.reduce((sum, row) => sum + row.outstanding, 0)),
        overdue: toMoney(overdueClientRows.reduce((sum, row) => sum + row.outstanding, 0)),
        openCount: openClientRows.length,
        overdueCount: overdueClientRows.length,
        nextPayment,
        rows: clientRows,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding || a.client.localeCompare(b.client));

  return {
    monthLabels,
    rows,
    clientSummaries,
    totals: {
      billed: toMoney(rows.reduce((sum, row) => sum + row.amount, 0)),
      paid: toMoney(paidRows.reduce((sum, row) => sum + row.paid, 0)),
      outstanding: toMoney(openRows.reduce((sum, row) => sum + row.outstanding, 0)),
      overdue: toMoney(overdueRows.reduce((sum, row) => sum + row.outstanding, 0)),
      openCount: openRows.length,
      overdueCount: overdueRows.length,
      monthTotals,
    },
  };
}

export function createAccountsReceivableCsv() {
  const data = getAccountsReceivableData();
  const headers = [
    "Client",
    "Project",
    "Project type",
    "Invoice",
    "Invoice #",
    "Payment #",
    "Due date",
    "Status",
    "Method",
    "Amount",
    "Paid",
    "Outstanding",
    ...data.monthLabels,
  ];
  const rows = data.rows.map((row) => [
    row.client,
    row.projectName,
    row.projectType,
    row.invoiceLabel,
    row.invoiceNumber,
    row.paymentNumber,
    row.dueDate.slice(0, 10),
    row.status,
    row.method,
    row.amount.toFixed(2),
    row.paid.toFixed(2),
    row.outstanding.toFixed(2),
    ...row.months.map((value) => value.toFixed(2)),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}
