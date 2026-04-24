import Link from "next/link";
import {
  createLedgerTransactionAction,
  deleteLedgerTransactionsAction,
  updateLedgerTransactionAction,
} from "@/app/actions";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";

export default async function LedgerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; updated?: string; error?: string }>;
}) {
  const [{ saved, deleted, updated, error }, { user, data, ledger, shellSummary }] = await Promise.all([
    searchParams,
    getLedgerPageData(),
  ]);

  return (
    <LedgerWorkspace
      copy="Capture one-off income and expenses with receipts, project links, and bookkeeping notes, then review the live transaction table underneath."
      currentPath="/ledger/transactions"
      summary={shellSummary}
      title="Transactions"
      user={user}
    >
      {saved ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Transaction added to the ledger.
        </div>
      ) : null}

      {deleted ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Selected transaction deleted.
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Transaction updated.
        </div>
      ) : null}

      {error === "transaction-invalid" ? (
        <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
          Add a valid date, category, amount, and description before saving the ledger entry.
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <details className="self-start rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">New transaction</p>
              <h2 className="mt-2 text-2xl font-semibold">Manual entry</h2>
            </div>
            <span className="text-lg text-[var(--muted)]">+</span>
          </summary>

          <form action={createLedgerTransactionAction} encType="multipart/form-data" className="mt-5 grid gap-4">
            <div className="rounded-[1.2rem] border border-black/[0.06] bg-[rgba(247,241,232,0.42)] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Core details</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Amount, date, type, and category.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--forest)]">Required</span>
              </div>

              <div className="mt-4 grid gap-3.5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  <span>Date</span>
                  <input className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" defaultValue={new Date().toISOString().slice(0, 10)} name="transactionDate" required type="date" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  <span>Amount</span>
                  <input className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  <span>Direction</span>
                  <select className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" defaultValue="EXPENSE" name="direction">
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </label>
                <div className="grid gap-2 text-sm font-semibold">
                  <span>Category</span>
                  <select className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" name="category">
                    {ledger.categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <details className="rounded-2xl border border-dashed border-black/[0.14] bg-white px-3.5 py-2.5">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--forest)]">
                      + Custom category
                    </summary>
                    <input
                      className="mt-3 h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]"
                      name="customCategory"
                      placeholder="Type your custom category"
                    />
                    <p className="mt-2 text-xs font-normal leading-5 text-[var(--muted)]">
                      If filled in, this custom category replaces the dropdown category.
                    </p>
                  </details>
                </div>
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  <span>Description</span>
                  <input className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" name="description" placeholder="What was this transaction for?" required />
                </label>
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-black/[0.06] bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Optional details</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Attach a receipt or connect this entry to a project.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3.5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  <span>Payment method</span>
                  <input className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" name="paymentMethod" placeholder="Card, bank, cash" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  <span>Receipt</span>
                  <span className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:bg-[rgba(47,125,92,0.05)]">
                    <svg aria-hidden="true" className="h-4 w-4 text-[var(--forest)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Attach receipt
                    <input className="sr-only" name="receipt" type="file" />
                  </span>
                </label>
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  <span>Link to project</span>
                  <select className="h-12 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition focus:border-[var(--forest)]" name="projectId">
                    <option value="">No linked project</option>
                    {data.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.client} | {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] bg-[rgba(16,33,52,0.04)] px-4 py-3">
              <p className="text-sm text-[var(--muted)]">This entry will update the ledger reports and live spreadsheet.</p>
              <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Add transaction
              </button>
            </div>
          </form>
        </details>

        <details className="self-start rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Transaction log</p>
              <h2 className="mt-2 text-2xl font-semibold">Latest activity</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link className="text-sm font-semibold text-[var(--forest)] underline" href="/ledger/reconciliation">
                Reconcile entries
              </Link>
              <span className="text-lg text-[var(--muted)]">+</span>
            </div>
          </summary>

          <div className="mt-5 grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-3.5 py-3">
              <p className="text-sm text-[var(--muted)]">Edit mistaken entries in place, or delete a single row if it should not exist.</p>
            </div>

            <div className="grid gap-2.5">
              {ledger.entries.slice(0, 15).map((entry) => (
                <article key={entry.id} className="rounded-[1rem] border border-black/[0.06] bg-[rgba(247,241,232,0.58)] px-3.5 py-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{entry.description}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {shortDate.format(new Date(entry.transactionDate))} | {entry.categoryLabel}
                          {entry.counterparty ? ` | ${entry.counterparty}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            entry.direction === "EXPENSE" ? "text-[var(--accent)]" : "text-[var(--forest)]"
                          }`}
                        >
                          {entry.direction === "EXPENSE" ? "-" : "+"}
                          {preciseCurrencyFormatter.format(entry.amount)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                          {entry.category === "CLIENT_REFUNDS"
                            ? "Client refund"
                            : entry.isReconciled
                              ? "Reconciled"
                              : "Needs review"}
                        </p>
                      </div>
                    </div>
                    <form action={deleteLedgerTransactionsAction}>
                      <input name="transactionIds" type="hidden" value={entry.id} />
                      <button
                        aria-label={`Delete transaction ${entry.description}`}
                        className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
                      >
                        Delete
                      </button>
                    </form>
                  </div>

                  <details className="mt-3 rounded-[0.9rem] border border-black/[0.06] bg-white/80 px-3.5 py-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--forest)]">
                      Edit transaction
                    </summary>
                    <form action={updateLedgerTransactionAction} encType="multipart/form-data" className="mt-4 grid gap-3">
                      <input name="transactionId" type="hidden" value={entry.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          Date
                          <input className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.transactionDate.slice(0, 10)} name="transactionDate" required type="date" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Amount
                          <input className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.amount} min="0.01" name="amount" required step="0.01" type="number" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Direction
                          <select className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.direction} name="direction">
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Category
                          <select className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.category} name="category">
                            {ledger.categories.map((category) => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                          Description
                          <input className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.description} name="description" required />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Payment method
                          <input className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.paymentMethod} name="paymentMethod" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Replace receipt
                          <input className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 py-2 text-sm" name="receipt" type="file" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                          Link to project
                          <select className="h-11 rounded-2xl border border-black/[0.08] bg-white px-4 text-sm" defaultValue={entry.projectId} name="projectId">
                            <option value="">No linked project</option>
                            {data.projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.client} | {project.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <button className="justify-self-start rounded-full bg-[var(--sidebar)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                        Save changes
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </details>
      </div>
    </LedgerWorkspace>
  );
}
