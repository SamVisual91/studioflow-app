import Link from "next/link";
import { notFound } from "next/navigation";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { getAccountsReceivableData } from "@/lib/accounts-receivable";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";

function statusClass(status: string) {
  if (status === "Paid") {
    return "border-[rgba(47,125,92,0.28)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]";
  }

  if (status === "Overdue") {
    return "border-[rgba(207,114,79,0.28)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";
  }

  return "border-black/[0.1] bg-white text-[var(--muted)]";
}

function formatSheetValue(value: number) {
  return value ? preciseCurrencyFormatter.format(value) : "-";
}

export default async function ClientReceivablePage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const [{ client }, { user, shellSummary }, receivables] = await Promise.all([
    params,
    getLedgerPageData(),
    Promise.resolve(getAccountsReceivableData()),
  ]);
  const clientName = decodeURIComponent(client);
  const clientSummary = receivables.clientSummaries.find((item) => item.client === clientName);

  if (!clientSummary) {
    notFound();
  }

  const nextPayments = clientSummary.rows
    .filter((row) => row.status !== "Paid")
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const overduePayments = clientSummary.rows.filter((row) => row.status === "Overdue");

  return (
    <LedgerWorkspace
      copy={`Receivables detail for ${clientSummary.client}. Review their balance, paid total, next payments, and overdue items.`}
      currentPath="/ledger/accounts-receivable"
      summary={shellSummary}
      title={clientSummary.client}
      user={user}
      actions={
        <Link
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10263d] transition hover:bg-white/90"
          href="/ledger/accounts-receivable"
        >
          Back to receivables
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Balance", value: preciseCurrencyFormatter.format(clientSummary.outstanding), note: `${clientSummary.openCount} open payments` },
          { label: "Paid", value: preciseCurrencyFormatter.format(clientSummary.paid), note: "Collected so far" },
          { label: "Billed", value: preciseCurrencyFormatter.format(clientSummary.billed), note: clientSummary.projectName || "Client total" },
          { label: "Overdue", value: preciseCurrencyFormatter.format(clientSummary.overdue), note: `${clientSummary.overdueCount} overdue payments` },
        ].map((card) => (
          <article key={card.label} className="rounded-[1.35rem] border border-black/[0.08] bg-white/94 p-4 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">{card.label}</p>
            <p className="mt-3 text-[1.75rem] font-semibold">{card.value}</p>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Next payments</p>
          <h2 className="mt-2 text-2xl font-semibold">What is coming up</h2>
          <div className="mt-5 grid gap-3">
            {nextPayments.length > 0 ? (
              nextPayments.slice(0, 6).map((payment) => (
                <div key={payment.id} className="rounded-[1rem] border border-black/[0.06] bg-[rgba(247,241,232,0.58)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{payment.invoiceLabel}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {payment.invoiceNumber} | due {shortDate.format(new Date(payment.dueDate))}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">{preciseCurrencyFormatter.format(payment.outstanding)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1rem] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
                This client has no upcoming open payments.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Overdue</p>
          <h2 className="mt-2 text-2xl font-semibold">Items needing follow-up</h2>
          <div className="mt-5 grid gap-3">
            {overduePayments.length > 0 ? (
              overduePayments.map((payment) => (
                <div key={payment.id} className="rounded-[1rem] border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.06)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{payment.invoiceLabel}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {payment.invoiceNumber} | was due {shortDate.format(new Date(payment.dueDate))}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-[var(--accent)]">
                      {preciseCurrencyFormatter.format(payment.outstanding)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1rem] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
                No overdue payments for this client.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Client spreadsheet</p>
            <h2 className="mt-2 text-2xl font-semibold">Payment schedule detail</h2>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[1.15rem] border border-black/[0.08]">
          <table className="min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[rgba(16,33,52,0.06)] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">Invoice</th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">Due</th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium">Status</th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium text-right">Amount</th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium text-right">Paid</th>
                <th className="border-b border-r border-black/[0.08] px-4 py-3 font-medium text-right">Outstanding</th>
                {receivables.monthLabels.map((month) => (
                  <th key={month} className="border-b border-r border-black/[0.08] px-4 py-3 font-medium text-right last:border-r-0">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientSummary.rows.map((payment) => (
                <tr key={payment.id} className="bg-white hover:bg-[rgba(47,125,92,0.04)]">
                  <td className="border-b border-r border-black/[0.08] px-4 py-3">
                    <p className="font-medium">{payment.invoiceLabel}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {payment.invoiceNumber} | Payment {payment.paymentNumber}
                    </p>
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3">
                    {shortDate.format(new Date(payment.dueDate))}
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 text-right font-semibold">
                    {preciseCurrencyFormatter.format(payment.amount)}
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 text-right text-[var(--forest)]">
                    {formatSheetValue(payment.paid)}
                  </td>
                  <td className="border-b border-r border-black/[0.08] px-4 py-3 text-right text-[var(--accent)]">
                    {formatSheetValue(payment.outstanding)}
                  </td>
                  {payment.months.map((value, index) => (
                    <td key={`${payment.id}-${index}`} className="border-b border-r border-black/[0.08] px-4 py-3 text-right last:border-r-0">
                      {formatSheetValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </LedgerWorkspace>
  );
}
