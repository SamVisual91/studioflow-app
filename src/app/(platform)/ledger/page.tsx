import Link from "next/link";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";
import { getMileageData } from "@/lib/mileage";

export default async function LedgerOverviewPage() {
  const { user, data, ledger, shellSummary } = await getLedgerPageData();
  const mileage = getMileageData();
  const recentEntries = ledger.entries.slice(0, 8);
  const unreconciledCount = ledger.entries.filter((entry) => !entry.isReconciled).length;
  const recurringActive = ledger.recurringRules.filter((rule) => rule.active).length;
  const monthlyRefunds = ledger.summary.month.clientRefunds;

  return (
    <LedgerWorkspace
      copy="A cleaner accounting home for your videography business. Review profit, reconcile statement activity, monitor recurring expenses, and drill into transactions without working through one long page."
      currentPath="/ledger"
      summary={shellSummary}
      title="Accounting Overview"
      user={user}
      actions={
        <>
          <Link
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10263d] transition hover:bg-white/90"
            href="/ledger/transactions"
          >
            Add transaction
          </Link>
          <Link
            className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:bg-white/14"
            href="/ledger/reconciliation"
          >
            Reconcile books
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Monthly profit", value: preciseCurrencyFormatter.format(ledger.summary.month.profit), note: ledger.summary.month.label },
          { label: "Quarterly profit", value: preciseCurrencyFormatter.format(ledger.summary.quarter.profit), note: ledger.summary.quarter.label },
          { label: "Client refunds", value: preciseCurrencyFormatter.format(monthlyRefunds), note: "Refunded this month" },
          { label: "Unreconciled entries", value: String(unreconciledCount), note: "Need statement review" },
          { label: "Recurring rules", value: String(recurringActive), note: "Active monthly automations" },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.35rem] border border-black/[0.08] bg-white/94 p-4 shadow-[0_14px_28px_rgba(59,36,17,0.07)]"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">{card.label}</p>
            <p className="mt-3 text-[1.75rem] font-semibold">{card.value}</p>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold">Recent ledger activity</h2>
            </div>
            <Link className="text-sm font-semibold text-[var(--forest)] underline" href="/ledger/transactions">
              Open transactions
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  <th className="px-2 py-2.5 font-medium">Date</th>
                  <th className="px-2 py-2.5 font-medium">Category</th>
                  <th className="px-2 py-2.5 font-medium">Description</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-black/[0.06] last:border-b-0">
                    <td className="px-2 py-3">{shortDate.format(new Date(entry.transactionDate))}</td>
                    <td className="px-2 py-3">{entry.categoryLabel}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium">{entry.description}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{entry.counterparty || "General ledger"}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          entry.isReconciled
                            ? "bg-[rgba(47,125,92,0.1)] text-[var(--forest)]"
                            : "bg-[rgba(207,114,79,0.1)] text-[var(--accent)]"
                        }`}
                      >
                        {entry.isReconciled ? "Reconciled" : "Review"}
                      </span>
                    </td>
                    <td
                      className={`px-2 py-3 text-right font-semibold ${
                        entry.direction === "EXPENSE" ? "text-[var(--accent)]" : "text-[var(--forest)]"
                      }`}
                    >
                      {entry.direction === "EXPENSE" ? "-" : "+"}
                      {preciseCurrencyFormatter.format(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Recurring</p>
            <h2 className="mt-2 text-2xl font-semibold">Upcoming monthly activity</h2>
            <div className="mt-4 grid gap-2.5">
              {ledger.recurringRules.slice(0, 4).map((rule) => (
                <div key={rule.id} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                  <p className="font-semibold">{rule.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {rule.categoryLabel} | {preciseCurrencyFormatter.format(rule.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Next run {shortDate.format(new Date(rule.nextRunDate))}
                  </p>
                </div>
              ))}
            </div>
            <Link className="mt-5 inline-flex text-sm font-semibold text-[var(--forest)] underline" href="/ledger/recurring">
              Manage recurring rules
            </Link>
          </article>

          <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Reports</p>
            <h2 className="mt-2 text-2xl font-semibold">Period performance</h2>
            <div className="mt-4 grid gap-2.5">
              {[ledger.summary.month, ledger.summary.quarter, ledger.summary.year].map((report) => (
                <div key={report.label} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{report.label}</span>
                    <span className="text-sm text-[var(--muted)]">P&L</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Income {preciseCurrencyFormatter.format(report.income)} | Expenses {preciseCurrencyFormatter.format(report.expenses)} | Refunds {preciseCurrencyFormatter.format(report.clientRefunds)}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{preciseCurrencyFormatter.format(report.profit)}</p>
                </div>
              ))}
            </div>
            <Link className="mt-5 inline-flex text-sm font-semibold text-[var(--forest)] underline" href="/ledger/reports">
              Open reports
            </Link>
          </article>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Connected ops</p>
          <h2 className="mt-2 text-2xl font-semibold">Client revenue</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Invoice payments made through the rest of StudioFlow automatically land in the ledger, so your bookkeeping stays connected to client work.
          </p>
          <div className="mt-4 rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
            <p className="text-sm text-[var(--muted)]">Booked revenue</p>
            <p className="mt-1 text-2xl font-semibold">{preciseCurrencyFormatter.format(data.stats.bookedRevenue)}</p>
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Month-end flow</p>
          <h2 className="mt-2 text-2xl font-semibold">Close checklist</h2>
          <div className="mt-4 grid gap-2.5">
            {ledger.cycle.slice(0, 3).map((step, index) => (
              <div key={step.title} className="rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Step {index + 1}</p>
                <p className="mt-1 font-semibold">{step.title}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Exports</p>
          <h2 className="mt-2 text-2xl font-semibold">Tax-ready files</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link className="rounded-full border border-black/[0.08] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" href="/api/ledger/export">
              Export ledger CSV
            </Link>
            <Link className="rounded-full border border-black/[0.08] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" href="/api/ledger/export?format=schedule-c">
              Export Schedule C CSV
            </Link>
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Mileage</p>
          <h2 className="mt-2 text-2xl font-semibold">Drive log</h2>
          <div className="mt-4 rounded-[1rem] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
            <p className="text-sm text-[var(--muted)]">Miles this month</p>
            <p className="mt-1 text-2xl font-semibold">{mileage.summary.monthMiles.toFixed(1)} mi</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{mileage.summary.totalTrips} trips saved so far</p>
          </div>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[var(--forest)] underline" href="/ledger/mileage">
            Open mileage tracker
          </Link>
        </article>
      </div>
    </LedgerWorkspace>
  );
}
