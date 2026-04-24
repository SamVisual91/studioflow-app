import Link from "next/link";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const defaultRevenueRows = ["Weddings", "Businesses", "Others"] as const;

function getSafeDate(input: string) {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildCategorySheet(
  entries: Array<{
    transactionDate: string;
    direction: "INCOME" | "EXPENSE";
    categoryLabel: string;
    taxCategory?: string;
    amount: number;
  }>,
  direction: "INCOME" | "EXPENSE",
  year: number,
  filter?: (entry: {
    transactionDate: string;
    direction: "INCOME" | "EXPENSE";
    categoryLabel: string;
    taxCategory?: string;
    amount: number;
  }) => boolean,
) {
  const matchingEntries = entries.filter((entry) => {
    const date = getSafeDate(entry.transactionDate);
    return entry.direction === direction && date.getFullYear() === year && (!filter || filter(entry));
  });

  const grouped = new Map<string, number[]>();

  for (const entry of matchingEntries) {
    const monthIndex = getSafeDate(entry.transactionDate).getMonth();
    const row = grouped.get(entry.categoryLabel) ?? Array.from({ length: 12 }, () => 0);
    row[monthIndex] += Number(entry.amount || 0);
    grouped.set(entry.categoryLabel, row);
  }

  return Array.from(grouped.entries())
    .map(([label, months]) => ({
      label,
      months: months.map((value) => Math.round(value * 100) / 100),
      total: Math.round(months.reduce((sum, value) => sum + value, 0) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function sumMonthlyRows(rows: Array<{ months: number[]; total: number }>) {
  const months = Array.from({ length: 12 }, (_, index) =>
    Math.round(rows.reduce((sum, row) => sum + Number(row.months[index] || 0), 0) * 100) / 100,
  );

  return {
    months,
    total: Math.round(months.reduce((sum, value) => sum + value, 0) * 100) / 100,
  };
}

function addDefaultRows(rows: Array<{ label: string; months: number[]; total: number }>, labels: readonly string[]) {
  const normalized = new Map(rows.map((row) => [row.label.toLowerCase(), row]));

  for (const label of labels) {
    if (!normalized.has(label.toLowerCase())) {
      normalized.set(label.toLowerCase(), {
        label,
        months: Array.from({ length: 12 }, () => 0),
        total: 0,
      });
    }
  }

  return Array.from(normalized.values()).sort((a, b) => {
    const aIndex = labels.findIndex((label) => label.toLowerCase() === a.label.toLowerCase());
    const bIndex = labels.findIndex((label) => label.toLowerCase() === b.label.toLowerCase());

    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex;
    }

    if (aIndex >= 0) {
      return -1;
    }

    if (bIndex >= 0) {
      return 1;
    }

    return b.total - a.total || a.label.localeCompare(b.label);
  });
}

function formatSheetValue(value: number) {
  if (!value) {
    return "-";
  }

  return preciseCurrencyFormatter.format(value);
}

export default async function LedgerReportsPage() {
  const { user, ledger, shellSummary } = await getLedgerPageData();
  const currentYear = new Date().getFullYear();
  const hasCurrentYearEntries = ledger.entries.some((entry) => getSafeDate(entry.transactionDate).getFullYear() === currentYear);
  const reportYear = hasCurrentYearEntries ? currentYear : ledger.reports.annual[0]?.year ?? currentYear;
  const incomeRows = addDefaultRows(buildCategorySheet(ledger.entries, "INCOME", reportYear), defaultRevenueRows);
  const contractorRows = buildCategorySheet(ledger.entries, "EXPENSE", reportYear, (entry) => {
    const category = entry.categoryLabel.toLowerCase();
    const taxCategory = (entry.taxCategory || "").toLowerCase();

    return category.includes("contractor") || taxCategory === "contract labor";
  });
  const expenseRows = buildCategorySheet(ledger.entries, "EXPENSE", reportYear, (entry) => {
    const category = entry.categoryLabel.toLowerCase();
    const taxCategory = (entry.taxCategory || "").toLowerCase();

    return !category.includes("contractor") && taxCategory !== "contract labor";
  });
  const incomeTotals = sumMonthlyRows(incomeRows);
  const contractorTotals = sumMonthlyRows(contractorRows);
  const totalExpenseTotals = sumMonthlyRows([...contractorRows, ...expenseRows]);
  const profitTotals = {
    months: incomeTotals.months.map((value, index) => Math.round((value - totalExpenseTotals.months[index]) * 100) / 100),
    total: Math.round((incomeTotals.total - totalExpenseTotals.total) * 100) / 100,
  };

  return (
    <LedgerWorkspace
      copy="Review month, quarter, and year performance, then work from a live spreadsheet that updates from your transaction ledger automatically."
      currentPath="/ledger/reports"
      summary={shellSummary}
      title="Reports"
      user={user}
      actions={
        <>
          <Link
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10263d] transition hover:bg-white/90"
            href="/api/ledger/export"
          >
            Export ledger CSV
          </Link>
          <Link
            className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:bg-white/14"
            href="/api/ledger/export?format=schedule-c"
          >
            Export Schedule C CSV
          </Link>
        </>
      }
    >
      <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Live spreadsheet</p>
            <h2 className="mt-2 text-2xl font-semibold">{reportYear} expenses and revenue sheet</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Every ledger entry and imported bank transaction flows into this sheet automatically. Add or reconcile
              transactions in Ledger, and this annual view updates with the new monthly totals. Client refunds now land
              in expenses automatically so your profit and annual reporting stay honest.
            </p>
          </div>
          <div className="rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-4 py-3 text-sm text-[var(--muted)]">
            Synced from live ledger entries
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[1.15rem] border border-black/[0.08]">
          <table className="min-w-[1180px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[rgba(16,33,52,0.06)] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <th className="sticky left-0 z-10 min-w-[260px] border-b border-r border-black/[0.08] bg-[rgba(16,33,52,0.06)] px-4 py-3 font-medium">
                  Sam Visual Revenue/Expense Record
                </th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">Year total</th>
                {monthLabels.map((month) => (
                  <th key={month} className="border-b border-r border-black/[0.08] px-4 py-3 font-medium last:border-r-0">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[rgba(47,125,92,0.08)]">
                <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-base font-semibold">
                  Revenue
                </td>
                <td className="border-b border-r border-black/[0.08] px-4 py-3 font-semibold">
                  {preciseCurrencyFormatter.format(incomeTotals.total)}
                </td>
                {incomeTotals.months.map((value, index) => (
                  <td key={`income-total-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 last:border-r-0">
                    {formatSheetValue(value)}
                  </td>
                ))}
              </tr>

              {incomeRows.map((row) => (
                <tr key={`income-${row.label}`} className="bg-[rgba(47,125,92,0.03)]">
                  <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(47,125,92,0.03)] px-4 py-3 font-medium text-[var(--forest)]">
                    {row.label}
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">
                    {preciseCurrencyFormatter.format(row.total)}
                  </td>
                  {row.months.map((value, index) => (
                    <td key={`income-${row.label}-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 last:border-r-0">
                      {formatSheetValue(value)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-[rgba(71,178,193,0.16)]">
                <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(71,178,193,0.16)] px-4 py-3 text-base font-semibold">
                  1099 Contractors
                </td>
                <td className="border-b border-r border-black/[0.08] px-4 py-3 font-semibold text-[var(--accent)]">
                  {preciseCurrencyFormatter.format(contractorTotals.total)}
                </td>
                {contractorTotals.months.map((value, index) => (
                  <td key={`contractor-total-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 text-[var(--accent)] last:border-r-0">
                    {formatSheetValue(value)}
                  </td>
                ))}
              </tr>

              {contractorRows.length > 0 ? (
                contractorRows.map((row) => (
                  <tr key={`contractor-${row.label}`} className="bg-[rgba(71,178,193,0.07)]">
                    <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(71,178,193,0.07)] px-4 py-3 font-medium">
                      {row.label}
                    </td>
                    <td className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">
                      {preciseCurrencyFormatter.format(row.total)}
                    </td>
                    {row.months.map((value, index) => (
                      <td key={`contractor-${row.label}-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 last:border-r-0">
                        {formatSheetValue(value)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="bg-[rgba(71,178,193,0.04)]">
                  <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(71,178,193,0.04)] px-4 py-3 font-medium text-[var(--muted)]">
                    No contractor payments recorded yet
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 text-[var(--muted)]">-</td>
                  {monthLabels.map((month) => (
                    <td key={`contractor-empty-${month}`} className="border-b border-r border-black/[0.08] px-4 py-3 text-[var(--muted)] last:border-r-0">
                      -
                    </td>
                  ))}
                </tr>
              )}

              <tr className="bg-[rgba(16,33,52,0.03)]">
                <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(16,33,52,0.03)] px-4 py-3 text-base font-semibold">
                  Expenses
                </td>
                <td className="border-b border-r border-black/[0.08] px-4 py-3 font-semibold">
                  {preciseCurrencyFormatter.format(totalExpenseTotals.total)}
                </td>
                {totalExpenseTotals.months.map((value, index) => (
                  <td key={`expense-total-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 last:border-r-0">
                    {formatSheetValue(value)}
                  </td>
                ))}
              </tr>

              {expenseRows.map((row) => (
                <tr key={`expense-${row.label}`} className="bg-[rgba(207,114,79,0.03)]">
                  <td className="sticky left-0 z-10 border-b border-r border-black/[0.08] bg-[rgba(207,114,79,0.03)] px-4 py-3 font-medium">
                    {row.label}
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">
                    {preciseCurrencyFormatter.format(row.total)}
                  </td>
                  {row.months.map((value, index) => (
                    <td key={`expense-${row.label}-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 last:border-r-0">
                      {formatSheetValue(value)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-[rgba(16,33,52,0.08)]">
                <td className="sticky left-0 z-10 border-r border-black/[0.08] bg-[rgba(16,33,52,0.08)] px-4 py-3 text-base font-semibold">
                  Net profit
                </td>
                <td className="border-r border-black/[0.08] px-4 py-3 text-base font-semibold">
                  {preciseCurrencyFormatter.format(profitTotals.total)}
                </td>
                {profitTotals.months.map((value, index) => (
                  <td key={`profit-${index}`} className="border-r border-black/[0.08] px-4 py-3 font-semibold last:border-r-0">
                    {formatSheetValue(value)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <details className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Monthly</p>
              <h2 className="mt-2 text-2xl font-semibold">Month by month</h2>
            </div>
            <span className="text-lg text-[var(--muted)]">+</span>
          </summary>
          <div className="mt-4 grid gap-2.5">
            {ledger.reports.monthly.map((month) => (
              <div key={month.label} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{month.label}</span>
                  <span className="text-sm text-[var(--muted)]">{month.year}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Income {preciseCurrencyFormatter.format(month.income)} | Expenses {preciseCurrencyFormatter.format(month.expenses)} | Refunds {preciseCurrencyFormatter.format(month.clientRefunds)}
                </p>
                <p className="mt-1 text-lg font-semibold">P&amp;L {preciseCurrencyFormatter.format(month.profit)}</p>
              </div>
            ))}
          </div>
        </details>

        <details className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Quarterly</p>
              <h2 className="mt-2 text-2xl font-semibold">Quarter performance</h2>
            </div>
            <span className="text-lg text-[var(--muted)]">+</span>
          </summary>
          <div className="mt-4 grid gap-2.5">
            {ledger.reports.quarterly.map((quarter) => (
              <div key={quarter.label} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{quarter.label}</span>
                  <span className="text-sm text-[var(--muted)]">{quarter.year}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Income {preciseCurrencyFormatter.format(quarter.income)} | Expenses {preciseCurrencyFormatter.format(quarter.expenses)} | Refunds {preciseCurrencyFormatter.format(quarter.clientRefunds)}
                </p>
                <p className="mt-1 text-lg font-semibold">P&amp;L {preciseCurrencyFormatter.format(quarter.profit)}</p>
              </div>
            ))}
          </div>
        </details>

        <details className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Annual</p>
              <h2 className="mt-2 text-2xl font-semibold">Year-end view</h2>
            </div>
            <span className="text-lg text-[var(--muted)]">+</span>
          </summary>
          <div className="mt-4 grid gap-2.5">
            {ledger.reports.annual.map((year) => (
              <div key={year.label} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{year.label}</span>
                  <span className="text-sm text-[var(--muted)]">Annual</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Income {preciseCurrencyFormatter.format(year.income)} | Expenses {preciseCurrencyFormatter.format(year.expenses)} | Refunds {preciseCurrencyFormatter.format(year.clientRefunds)}
                </p>
                <p className="mt-1 text-lg font-semibold">P&amp;L {preciseCurrencyFormatter.format(year.profit)}</p>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Income statement</p>
          <h2 className="mt-2 text-2xl font-semibold">Income categories</h2>
          <div className="mt-4 grid gap-2.5">
            {Object.entries(ledger.statement.incomeByCategory).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-[1rem] bg-[rgba(47,125,92,0.06)] px-3.5 py-3">
                <span>{label}</span>
                <span className="font-semibold">{preciseCurrencyFormatter.format(value)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Expense statement</p>
          <h2 className="mt-2 text-2xl font-semibold">Expense categories</h2>
          <div className="mt-4 grid gap-2.5">
            {Object.entries(ledger.statement.expenseByCategory).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-[1rem] bg-[rgba(207,114,79,0.06)] px-3.5 py-3">
                <span>{label}</span>
                <span className="font-semibold">{preciseCurrencyFormatter.format(value)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </LedgerWorkspace>
  );
}
