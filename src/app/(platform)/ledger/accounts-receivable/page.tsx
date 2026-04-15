import Link from "next/link";
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

export default async function AccountsReceivablePage() {
  const [{ user, shellSummary }, receivables] = await Promise.all([
    getLedgerPageData(),
    Promise.resolve(getAccountsReceivableData()),
  ]);

  return (
    <LedgerWorkspace
      copy="Track monthly, partial, and outstanding client payments from invoice schedules in one live accounts receivable sheet."
      currentPath="/ledger/accounts-receivable"
      summary={shellSummary}
      title="Accounts Receivable"
      user={user}
      actions={
        <Link
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10263d] transition hover:bg-white/90"
          href="/api/ledger/accounts-receivable"
        >
          Download receivables CSV
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total billed", value: preciseCurrencyFormatter.format(receivables.totals.billed), note: "All scheduled invoice payments" },
          { label: "Paid", value: preciseCurrencyFormatter.format(receivables.totals.paid), note: "Collected from clients" },
          { label: "Outstanding", value: preciseCurrencyFormatter.format(receivables.totals.outstanding), note: `${receivables.totals.openCount} open payments` },
          { label: "Overdue", value: preciseCurrencyFormatter.format(receivables.totals.overdue), note: `${receivables.totals.overdueCount} overdue payments` },
        ].map((card) => (
          <article key={card.label} className="rounded-[1.35rem] border border-black/[0.08] bg-white/94 p-4 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">{card.label}</p>
            <p className="mt-3 text-[1.75rem] font-semibold">{card.value}</p>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{card.note}</p>
          </article>
        ))}
      </div>

      <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Client subcategories</p>
            <h2 className="mt-2 text-2xl font-semibold">Receivables by client</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              New clients with invoice schedules appear here automatically. Click a client to see their balance,
              paid total, next payments, and overdue items.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {receivables.clientSummaries.map((client) => (
            <Link
              key={client.client}
              className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.48)] p-4 transition hover:border-[var(--forest)] hover:bg-[rgba(47,125,92,0.06)]"
              href={`/ledger/accounts-receivable/${client.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{client.client}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{client.projectName || "Client receivables"}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${client.overdueCount > 0 ? statusClass("Overdue") : client.outstanding > 0 ? statusClass("Upcoming") : statusClass("Paid")}`}>
                  {client.overdueCount > 0 ? "Overdue" : client.outstanding > 0 ? "Open" : "Paid"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-[0.9rem] bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Balance</p>
                  <p className="mt-1 font-semibold text-[var(--accent)]">{preciseCurrencyFormatter.format(client.outstanding)}</p>
                </div>
                <div className="rounded-[0.9rem] bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Paid</p>
                  <p className="mt-1 font-semibold text-[var(--forest)]">{preciseCurrencyFormatter.format(client.paid)}</p>
                </div>
                <div className="rounded-[0.9rem] bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Open</p>
                  <p className="mt-1 font-semibold">{client.openCount}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {client.nextPayment
                  ? `Next payment ${preciseCurrencyFormatter.format(client.nextPayment.outstanding)} due ${shortDate.format(new Date(client.nextPayment.dueDate))}`
                  : "No upcoming payments"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </LedgerWorkspace>
  );
}
