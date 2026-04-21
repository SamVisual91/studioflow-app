import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { resolveProjectForInvoice } from "@/lib/invoice-project";

type LedgerDirection = "INCOME" | "EXPENSE";

type LedgerRow = {
  id: string;
  transaction_date: string;
  direction: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string | null;
  counterparty: string | null;
  project_id: string | null;
  invoice_id: string | null;
  source_type: string | null;
  source_id: string | null;
  tax_category: string | null;
  receipt_path: string | null;
  reconciled_at: string | null;
  reconciliation_note: string | null;
  match_reference: string | null;
  match_confidence: number | null;
  import_hash: string | null;
  created_at: string;
  updated_at: string;
};

type LedgerInput = {
  transactionDate: string;
  direction: LedgerDirection;
  category: string;
  amount: number;
  description: string;
  paymentMethod?: string;
  counterparty?: string;
  projectId?: string;
  invoiceId?: string;
  sourceType?: string;
  sourceId?: string;
  taxCategory?: string;
  receiptPath?: string;
  reconciledAt?: string;
  reconciliationNote?: string;
  matchReference?: string;
  matchConfidence?: number;
  importHash?: string;
};

type RecurringLedgerRuleRow = {
  id: string;
  name: string;
  direction: string;
  category: string;
  amount: number;
  payment_method: string | null;
  counterparty: string | null;
  description: string;
  day_of_month: number;
  project_id: string | null;
  tax_category: string | null;
  active: number;
  next_run_date: string;
  last_run_date: string | null;
  created_at: string;
  updated_at: string;
};

const ledgerCategoryMeta = [
  { value: "WEDDINGS", label: "Weddings", direction: "INCOME", taxCategory: "Gross receipts" },
  { value: "BUSINESSES", label: "Businesses", direction: "INCOME", taxCategory: "Gross receipts" },
  { value: "OTHERS", label: "Others", direction: "INCOME", taxCategory: "Gross receipts" },
  { value: "CLIENT_PAYMENTS", label: "Client payments", direction: "INCOME", taxCategory: "Gross receipts" },
  { value: "OTHER_INCOME", label: "Other income", direction: "INCOME", taxCategory: "Other income" },
  { value: "EQUIPMENT", label: "Equipment", direction: "EXPENSE", taxCategory: "Supplies" },
  { value: "TRAVEL", label: "Travel", direction: "EXPENSE", taxCategory: "Travel" },
  { value: "MEALS", label: "Meals", direction: "EXPENSE", taxCategory: "Meals" },
  { value: "SOFTWARE", label: "Software subscriptions", direction: "EXPENSE", taxCategory: "Office expenses" },
  { value: "MARKETING", label: "Marketing", direction: "EXPENSE", taxCategory: "Advertising" },
  { value: "CONTRACTORS", label: "Contractors", direction: "EXPENSE", taxCategory: "Contract labor" },
  { value: "INSURANCE", label: "Insurance", direction: "EXPENSE", taxCategory: "Insurance" },
  { value: "STUDIO_RENT", label: "Studio rent", direction: "EXPENSE", taxCategory: "Rent or lease" },
  { value: "BANK_FEES", label: "Bank fees", direction: "EXPENSE", taxCategory: "Commissions and fees" },
  { value: "TAXES_FEES", label: "Taxes and licenses", direction: "EXPENSE", taxCategory: "Taxes and licenses" },
  { value: "EDUCATION", label: "Education", direction: "EXPENSE", taxCategory: "Other expenses" },
  { value: "OTHER_EXPENSE", label: "Other expense", direction: "EXPENSE", taxCategory: "Other expenses" },
] as const;

export const ledgerCategories = ledgerCategoryMeta;

function normalizeLedgerDate(input: string) {
  if (!input) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return `${input}T12:00:00.000Z`;
  }

  return input;
}

function formatRecurringRunDate(year: number, monthIndex: number, dayOfMonth: number) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}T12:00:00.000Z`;
}

function getNextMonthlyRunDate(afterDate: Date, dayOfMonth: number) {
  const year = afterDate.getUTCFullYear();
  const month = afterDate.getUTCMonth();
  const currentMonthRun = new Date(formatRecurringRunDate(year, month, dayOfMonth));

  if (currentMonthRun.getTime() > afterDate.getTime()) {
    return currentMonthRun.toISOString();
  }

  const nextMonth = new Date(Date.UTC(year, month + 1, 1, 12));
  return formatRecurringRunDate(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), dayOfMonth);
}

function getCurrentQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function getQuarterLabel(date: Date) {
  return `Q${getCurrentQuarter(date)} ${date.getFullYear()}`;
}

function safeDate(input: string) {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getDefaultTaxCategory(category: string, direction: LedgerDirection) {
  const categoryMeta = ledgerCategoryMeta.find((item) => item.value === category);
  return categoryMeta?.taxCategory || (direction === "INCOME" ? "Gross receipts" : "Other expenses");
}

function getProjectRevenueCategory(projectType?: string | null) {
  const normalizedType = normalizeText(projectType || "");

  if (normalizedType.includes("wedding")) {
    return "WEDDINGS";
  }

  if (
    normalizedType.includes("business") ||
    normalizedType.includes("brand") ||
    normalizedType.includes("commercial") ||
    normalizedType.includes("campaign") ||
    normalizedType.includes("corporate")
  ) {
    return "BUSINESSES";
  }

  return "OTHERS";
}

function toMoney(value: number) {
  return Math.round((Number.isNaN(value) ? 0 : value) * 100) / 100;
}

function sumAmounts(rows: Array<{ amount: number }>) {
  return toMoney(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0));
}

export function createLedgerTransaction(input: LedgerInput) {
  const db = getDb();

  if (input.sourceType && input.sourceId) {
    const existing = db
      .prepare("SELECT id FROM ledger_transactions WHERE source_type = ? AND source_id = ? LIMIT 1")
      .get(input.sourceType, input.sourceId) as { id?: string } | undefined;

    if (existing?.id) {
      return existing.id;
    }
  }

  const timestamp = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO ledger_transactions (
      id,
      transaction_date,
      direction,
      category,
      amount,
      description,
      payment_method,
      counterparty,
      project_id,
      invoice_id,
      source_type,
      source_id,
      tax_category,
      receipt_path,
      reconciled_at,
      reconciliation_note,
      match_reference,
      match_confidence,
      import_hash,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.transactionDate,
    input.direction,
    input.category,
    toMoney(input.amount),
    input.description,
    input.paymentMethod || "",
    input.counterparty || "",
    input.projectId || "",
    input.invoiceId || "",
    input.sourceType || "",
    input.sourceId || "",
    input.taxCategory || getDefaultTaxCategory(input.category, input.direction),
    input.receiptPath || "",
    input.reconciledAt || null,
    input.reconciliationNote || "",
    input.matchReference || "",
    input.matchConfidence ?? null,
    input.importHash || "",
    timestamp,
    timestamp
  );

  return id;
}

export function recordInvoicePaymentToLedger(opts: {
  invoiceId: string;
  paymentId: string;
  paymentAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  invoiceLabel?: string;
  invoiceNumber?: string;
  clientName?: string;
  sourceType?: string;
}) {
  const db = getDb();
  const paymentSourceId = `${opts.invoiceId}:${opts.paymentId}`;
  const existingPaymentRecord = db
    .prepare(
      "SELECT id FROM ledger_transactions WHERE invoice_id = ? AND source_id = ? AND direction = 'INCOME' LIMIT 1"
    )
    .get(opts.invoiceId, paymentSourceId) as { id?: string } | undefined;

  if (existingPaymentRecord?.id) {
    return existingPaymentRecord.id;
  }

  const invoice = db
    .prepare("SELECT id, project_id, client, label, method, public_token FROM invoices WHERE id = ? LIMIT 1")
    .get(opts.invoiceId) as
    | { id: string; project_id?: string | null; client: string; label: string; method: string; public_token?: string | null }
    | undefined;

  if (!invoice) {
    return null;
  }

  const resolvedProject = resolveProjectForInvoice(invoice, db);
  const project = resolvedProject?.id
    ? ((db
        .prepare("SELECT id, project_type FROM projects WHERE id = ? LIMIT 1")
        .get(resolvedProject.id) as { id?: string; project_type?: string } | undefined) ??
      undefined)
    : undefined;

  return createLedgerTransaction({
    transactionDate: opts.paymentDate || new Date().toISOString(),
    direction: "INCOME",
    category: getProjectRevenueCategory(project?.project_type),
    amount: Number(opts.paymentAmount || 0),
    description: `${opts.invoiceLabel || invoice.label} ${opts.invoiceNumber ? `(${opts.invoiceNumber})` : ""}`.trim(),
    paymentMethod: opts.paymentMethod || invoice.method,
    counterparty: opts.clientName || invoice.client,
    projectId: project?.id || "",
    invoiceId: invoice.id,
    sourceType: opts.sourceType || "INVOICE_PAYMENT",
    sourceId: paymentSourceId,
    taxCategory: "Gross receipts",
  });
}

export function syncRecurringLedgerRules() {
  const db = getDb();
  const rules = db
    .prepare("SELECT * FROM recurring_ledger_rules WHERE active = 1 ORDER BY next_run_date ASC")
    .all() as RecurringLedgerRuleRow[];
  const now = new Date();
  const updateRule = db.prepare(
    "UPDATE recurring_ledger_rules SET next_run_date = ?, last_run_date = ?, updated_at = ? WHERE id = ?"
  );

  for (const rule of rules) {
    let nextRun = safeDate(rule.next_run_date);

    while (nextRun.getTime() <= now.getTime()) {
      createLedgerTransaction({
        transactionDate: nextRun.toISOString(),
        direction: rule.direction as LedgerDirection,
        category: rule.category,
        amount: Number(rule.amount || 0),
        description: rule.description,
        paymentMethod: rule.payment_method || "",
        counterparty: rule.counterparty || "",
        projectId: rule.project_id || "",
        sourceType: "RECURRING_LEDGER",
        sourceId: `${rule.id}:${nextRun.toISOString().slice(0, 7)}`,
        taxCategory: rule.tax_category || getDefaultTaxCategory(rule.category, rule.direction as LedgerDirection),
      });

      const nextRunDate = getNextMonthlyRunDate(nextRun, Number(rule.day_of_month || 1));
      const timestamp = new Date().toISOString();
      updateRule.run(nextRunDate, nextRun.toISOString(), timestamp, rule.id);
      nextRun = safeDate(nextRunDate);
    }
  }
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function suggestLedgerImportMatch(input: {
  amount: number;
  description: string;
  counterparty?: string;
  paymentMethod?: string;
  defaultCategory?: string;
}) {
  const db = getDb();
  const description = normalizeText(input.description);
  const counterparty = normalizeText(input.counterparty || "");
  const recurringRules = db
    .prepare("SELECT * FROM recurring_ledger_rules WHERE active = 1")
    .all() as RecurringLedgerRuleRow[];
  const ledgerRows = db
    .prepare(
      "SELECT * FROM ledger_transactions WHERE receipt_path IS NOT NULL AND TRIM(receipt_path) <> '' ORDER BY updated_at DESC LIMIT 100"
    )
    .all() as LedgerRow[];

  let bestRule:
    | {
        id: string;
        category: string;
        paymentMethod: string;
        projectId: string;
        taxCategory: string;
        reference: string;
        confidence: number;
      }
    | undefined;

  for (const rule of recurringRules) {
    let score = 0;
    const ruleName = normalizeText(rule.name);
    const ruleCounterparty = normalizeText(rule.counterparty || "");
    const ruleDescription = normalizeText(rule.description);

    if (ruleCounterparty && (description.includes(ruleCounterparty) || counterparty.includes(ruleCounterparty))) {
      score += 4;
    }
    if (ruleName && description.includes(ruleName)) {
      score += 3;
    }
    if (ruleDescription && description.includes(ruleDescription.slice(0, 12))) {
      score += 2;
    }
    if (Math.abs(Number(rule.amount || 0) - input.amount) < 0.01) {
      score += 3;
    }

    if (!bestRule || score > bestRule.confidence) {
      bestRule = {
        id: rule.id,
        category: rule.category,
        paymentMethod: rule.payment_method || input.paymentMethod || "",
        projectId: rule.project_id || "",
        taxCategory: rule.tax_category || "",
        reference: `Matched recurring rule: ${rule.name}`,
        confidence: score,
      };
    }
  }

  let bestReceipt:
    | {
        receiptPath: string;
        reference: string;
        confidence: number;
      }
    | undefined;

  for (const row of ledgerRows) {
    let score = 0;
    const rowDescription = normalizeText(row.description || "");
    const rowCounterparty = normalizeText(row.counterparty || "");

    if (Math.abs(Number(row.amount || 0) - input.amount) < 0.01) {
      score += 3;
    }
    if (rowCounterparty && (description.includes(rowCounterparty) || counterparty.includes(rowCounterparty))) {
      score += 3;
    }
    if (rowDescription && description.includes(rowDescription.slice(0, 12))) {
      score += 2;
    }

    if (!bestReceipt || score > bestReceipt.confidence) {
      bestReceipt = {
        receiptPath: row.receipt_path || "",
        reference: `Matched receipt from ${row.description}`,
        confidence: score,
      };
    }
  }

  return {
    category: bestRule?.category || input.defaultCategory || "OTHER_EXPENSE",
    paymentMethod: bestRule?.paymentMethod || input.paymentMethod || "",
    projectId: bestRule?.projectId || "",
    taxCategory: bestRule?.taxCategory || "",
    matchReference: bestRule?.reference || bestReceipt?.reference || "",
    matchConfidence: Math.max(bestRule?.confidence || 0, bestReceipt?.confidence || 0),
    receiptPath: bestReceipt && bestReceipt.confidence >= 4 ? bestReceipt.receiptPath : "",
  };
}

export function backfillLedgerInvoiceTransactions() {
  const db = getDb();
  const invoices = db
    .prepare("SELECT id, client, label, method, status, amount, due_date, payment_schedule FROM invoices")
    .all() as Array<Record<string, unknown>>;

  for (const invoice of invoices) {
    const paymentSchedule = (() => {
      try {
        return JSON.parse(String(invoice.payment_schedule ?? "[]")) as Array<{
          id: string;
          amount: number;
          dueDate: string;
          status: string;
          invoiceNumber: string;
        }>;
      } catch {
        return [];
      }
    })();

    if (paymentSchedule.length > 0) {
      paymentSchedule
        .filter((payment) => payment.status === "PAID")
        .forEach((payment) => {
          recordInvoicePaymentToLedger({
            invoiceId: String(invoice.id),
            paymentId: payment.id,
            paymentAmount: Number(payment.amount || 0),
            paymentDate: payment.dueDate ? normalizeLedgerDate(payment.dueDate) : normalizeLedgerDate(String(invoice.due_date)),
            paymentMethod: String(invoice.method || ""),
            invoiceLabel: String(invoice.label || ""),
            invoiceNumber: String(payment.invoiceNumber || ""),
            clientName: String(invoice.client || ""),
            sourceType: "INVOICE_BACKFILL",
          });
        });
      continue;
    }

    if (String(invoice.status) === "PAID") {
      recordInvoicePaymentToLedger({
        invoiceId: String(invoice.id),
        paymentId: "paid-in-full",
        paymentAmount: Number(invoice.amount || 0),
        paymentDate: normalizeLedgerDate(String(invoice.due_date || new Date().toISOString())),
        paymentMethod: String(invoice.method || ""),
        invoiceLabel: String(invoice.label || ""),
        invoiceNumber: "Paid in full",
        clientName: String(invoice.client || ""),
        sourceType: "INVOICE_BACKFILL",
      });
    }
  }
}

export function getLedgerData() {
  syncRecurringLedgerRules();
  backfillLedgerInvoiceTransactions();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ledger_transactions ORDER BY transaction_date DESC, created_at DESC")
    .all() as LedgerRow[];
  const projects = db.prepare("SELECT id, project_type FROM projects").all() as Array<{
    id: string;
    project_type: string | null;
  }>;
  const projectTypeById = new Map(projects.map((project) => [project.id, project.project_type || ""]));
  const recurringRules = db
    .prepare("SELECT * FROM recurring_ledger_rules ORDER BY active DESC, next_run_date ASC, created_at DESC")
    .all() as RecurringLedgerRuleRow[];

  const entries = rows.map((row) => {
    const category =
      row.category === "CLIENT_PAYMENTS"
        ? getProjectRevenueCategory(projectTypeById.get(row.project_id || ""))
        : row.category;

    return {
      id: row.id,
      transactionDate: row.transaction_date,
      direction: row.direction as LedgerDirection,
      category,
      categoryLabel: ledgerCategoryMeta.find((item) => item.value === category)?.label || category,
      amount: Number(row.amount || 0),
      description: row.description,
      paymentMethod: row.payment_method || "",
      counterparty: row.counterparty || "",
      projectId: row.project_id || "",
      invoiceId: row.invoice_id || "",
      sourceType: row.source_type || "",
      sourceId: row.source_id || "",
      taxCategory: row.tax_category || "",
      receiptPath: row.receipt_path || "",
      reconciledAt: row.reconciled_at || "",
      reconciliationNote: row.reconciliation_note || "",
      matchReference: row.match_reference || "",
      matchConfidence: Number(row.match_confidence || 0),
      importHash: row.import_hash || "",
      isReconciled: Boolean(row.reconciled_at),
      createdAt: row.created_at,
    };
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = getCurrentQuarter(now);

  const currentMonthEntries = entries.filter((entry) => {
    const date = safeDate(entry.transactionDate);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });
  const currentQuarterEntries = entries.filter((entry) => {
    const date = safeDate(entry.transactionDate);
    return date.getFullYear() === currentYear && getCurrentQuarter(date) === currentQuarter;
  });
  const currentYearEntries = entries.filter((entry) => safeDate(entry.transactionDate).getFullYear() === currentYear);

  const summarize = (subset: typeof entries) => {
    const income = sumAmounts(subset.filter((entry) => entry.direction === "INCOME"));
    const expenses = sumAmounts(subset.filter((entry) => entry.direction === "EXPENSE"));
    return {
      income,
      expenses,
      profit: toMoney(income - expenses),
    };
  };

  const monthlyReports = Array.from({ length: 12 }, (_, monthIndex) => {
    const periodEntries = currentYearEntries.filter((entry) => safeDate(entry.transactionDate).getMonth() === monthIndex);
    return {
      label: new Date(currentYear, monthIndex, 1).toLocaleString("en-US", { month: "long" }),
      month: monthIndex + 1,
      year: currentYear,
      ...summarize(periodEntries),
    };
  });

  const quarterlyReports = [1, 2, 3, 4].map((quarter) => {
    const periodEntries = currentYearEntries.filter((entry) => getCurrentQuarter(safeDate(entry.transactionDate)) === quarter);
    return {
      label: `Q${quarter}`,
      year: currentYear,
      ...summarize(periodEntries),
    };
  });

  const annualReports = Array.from(
    new Set(entries.map((entry) => safeDate(entry.transactionDate).getFullYear()))
  )
    .sort((a, b) => b - a)
    .map((year) => {
      const periodEntries = entries.filter((entry) => safeDate(entry.transactionDate).getFullYear() === year);
      return {
        label: String(year),
        year,
        ...summarize(periodEntries),
      };
    });

  const incomeByCategory = entries
    .filter((entry) => entry.direction === "INCOME")
    .reduce<Record<string, number>>((acc, entry) => {
      acc[entry.categoryLabel] = toMoney((acc[entry.categoryLabel] || 0) + entry.amount);
      return acc;
    }, {});
  const expenseByCategory = entries
    .filter((entry) => entry.direction === "EXPENSE")
    .reduce<Record<string, number>>((acc, entry) => {
      acc[entry.categoryLabel] = toMoney((acc[entry.categoryLabel] || 0) + entry.amount);
      return acc;
    }, {});

  const scheduleCSummary = entries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.taxCategory || "Other expenses";
    acc[key] = toMoney((acc[key] || 0) + (entry.direction === "EXPENSE" ? entry.amount : 0));
    return acc;
  }, {});

  return {
    entries,
    recurringRules: recurringRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      direction: rule.direction as LedgerDirection,
      category: rule.category,
      categoryLabel: ledgerCategoryMeta.find((item) => item.value === rule.category)?.label || rule.category,
      amount: Number(rule.amount || 0),
      paymentMethod: rule.payment_method || "",
      counterparty: rule.counterparty || "",
      description: rule.description,
      dayOfMonth: Number(rule.day_of_month || 1),
      projectId: rule.project_id || "",
      taxCategory: rule.tax_category || "",
      active: Number(rule.active || 0) === 1,
      nextRunDate: rule.next_run_date,
      lastRunDate: rule.last_run_date || "",
    })),
    categories: ledgerCategoryMeta,
    summary: {
      month: {
        label: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
        ...summarize(currentMonthEntries),
      },
      quarter: {
        label: getQuarterLabel(now),
        ...summarize(currentQuarterEntries),
      },
      year: {
        label: String(currentYear),
        ...summarize(currentYearEntries),
      },
    },
    reports: {
      monthly: monthlyReports,
      quarterly: quarterlyReports,
      annual: annualReports,
    },
    statement: {
      incomeByCategory,
      expenseByCategory,
    },
    scheduleC: {
      rows: entries.map((entry) => ({
        date: entry.transactionDate,
        description: entry.description,
        category: entry.categoryLabel,
        taxCategory: entry.taxCategory,
        direction: entry.direction,
        amount: entry.amount,
        counterparty: entry.counterparty,
        paymentMethod: entry.paymentMethod,
        receiptPath: entry.receiptPath,
        reconciledAt: entry.reconciledAt,
      })),
      summary: scheduleCSummary,
    },
    cycle: [
      {
        title: "Weekly capture",
        description: "Enter every client payment, expense, subscription, and mileage-related cost into the ledger before the week closes.",
      },
      {
        title: "Month-end review",
        description: "Review categories, reconcile bank and card activity, and check that every paid invoice has a matching ledger entry.",
      },
      {
        title: "Quarterly reporting",
        description: "Review quarterly profit, travel, equipment, software, and contractor costs so tax reserves stay current.",
      },
      {
        title: "Year-end tax prep",
        description: "Export the Schedule C style CSV, confirm categories, and hand the ledger to your CPA or tax workflow.",
      },
    ],
  };
}

export function createLedgerCsv(format: "standard" | "schedule-c" = "standard") {
  const data = getLedgerData();

  const rows =
    format === "schedule-c"
      ? [
          ["Date", "Description", "Category", "Schedule C mapping", "Direction", "Amount", "Counterparty", "Payment method", "Receipt", "Reconciled at"],
          ...data.scheduleC.rows.map((row) => [
            row.date,
            row.description,
            row.category,
            row.taxCategory,
            row.direction,
            row.amount.toFixed(2),
            row.counterparty,
            row.paymentMethod,
            row.receiptPath,
            row.reconciledAt,
          ]),
        ]
      : [
          ["Date", "Direction", "Category", "Amount", "Description", "Counterparty", "Payment method", "Tax category", "Receipt", "Reconciled at"],
          ...data.entries.map((entry) => [
            entry.transactionDate,
            entry.direction,
            entry.categoryLabel,
            entry.amount.toFixed(2),
            entry.description,
            entry.counterparty,
            entry.paymentMethod,
            entry.taxCategory,
            entry.receiptPath,
            entry.reconciledAt,
          ]),
        ];

  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`)
        .join(",")
    )
    .join("\n");
}
