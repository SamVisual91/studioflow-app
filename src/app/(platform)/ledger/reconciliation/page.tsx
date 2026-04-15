import Link from "next/link";
import { importBankStatementAction, reconcileLedgerTransactionAction } from "@/app/actions";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";

export default async function LedgerReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; reconciled?: string; error?: string }>;
}) {
  const [{ saved, reconciled, error }, { user, data, ledger, shellSummary }] = await Promise.all([
    searchParams,
    getLedgerPageData(),
  ]);
  const unreconciled = ledger.entries.filter((entry) => !entry.isReconciled);

  return (
    <LedgerWorkspace
      copy="Bring in statement rows, review suggested matches, and mark entries reconciled as you close the books."
      currentPath="/ledger/reconciliation"
      summary={shellSummary}
      title="Reconciliation"
      user={user}
    >
      {saved ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Import completed. New rows were added to the ledger.
        </div>
      ) : null}
      {reconciled ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Transaction marked as reconciled.
        </div>
      ) : null}
      {error === "transaction-invalid" ? (
        <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
          The import or reconciliation input was invalid. Double-check the CSV and try again.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <form
          action={importBankStatementAction}
          encType="multipart/form-data"
          className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Bank import</p>
          <h2 className="mt-2 text-2xl font-semibold">Upload statement CSV</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Use a CSV with `date`, `description`, and `amount` columns. Imported rows get duplicate protection and matching suggestions.
          </p>
          <div className="mt-4 grid gap-3.5">
            <label className="grid gap-2 text-sm font-medium">
              Statement file
              <input className="rounded-2xl border border-black/[0.08] px-4 py-[0.8rem] text-sm" name="statement" required type="file" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Default expense category
              <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue="OTHER_EXPENSE" name="defaultCategory">
                {ledger.categories
                  .filter((category) => category.direction === "EXPENSE")
                  .map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Payment method label
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue="Bank statement" name="paymentMethod" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Link to project
              <select className="rounded-2xl border border-black/[0.08] px-4 py-3" name="projectId">
                <option value="">No linked project</option>
                {data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.client} | {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Import bank statement
          </button>
          <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--forest)] underline" href="/ledger/transactions">
            Add manual transaction instead
          </Link>
        </form>

        <article className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Needs review</p>
              <h2 className="mt-2 text-2xl font-semibold">Unreconciled ledger rows</h2>
            </div>
            <span className="rounded-full bg-[rgba(207,114,79,0.1)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
              {unreconciled.length} open
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {unreconciled.map((entry) => (
              <div key={entry.id} className="rounded-[1rem] border border-black/[0.06] bg-[rgba(247,241,232,0.58)] p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entry.description}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {shortDate.format(new Date(entry.transactionDate))} | {entry.categoryLabel}
                      {entry.counterparty ? ` | ${entry.counterparty}` : ""}
                    </p>
                    {entry.matchReference ? (
                      <p className="mt-1 text-xs font-medium text-[var(--forest)]">
                        {entry.matchReference}
                        {entry.matchConfidence ? ` | score ${entry.matchConfidence}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{preciseCurrencyFormatter.format(entry.amount)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{entry.direction}</p>
                  </div>
                </div>

                <form action={reconcileLedgerTransactionAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <input name="transactionId" type="hidden" value={entry.id} />
                  <input
                    className="rounded-2xl border border-black/[0.08] px-4 py-3 text-sm"
                    defaultValue={entry.reconciliationNote}
                    name="reconciliationNote"
                    placeholder="Statement page, receipt, or matching note"
                  />
                  <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Mark reconciled
                  </button>
                </form>
              </div>
            ))}
          </div>
        </article>
      </div>
    </LedgerWorkspace>
  );
}
