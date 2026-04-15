import {
  createRecurringLedgerRuleAction,
  deleteRecurringLedgerRuleAction,
  toggleRecurringLedgerRuleAction,
  updateRecurringLedgerRuleAction,
} from "@/app/actions";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData, preciseCurrencyFormatter } from "@/lib/ledger-page";

export default async function LedgerRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ recurring?: string }>;
}) {
  const [{ recurring }, { user, data, ledger, shellSummary }] = await Promise.all([
    searchParams,
    getLedgerPageData(),
  ]);

  return (
    <LedgerWorkspace
      copy="Set up and manage monthly software, rent, insurance, and repeating vendor charges so they flow into the ledger automatically."
      currentPath="/ledger/recurring"
      summary={shellSummary}
      title="Recurring Rules"
      user={user}
    >
      {recurring ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Recurring rule updated successfully.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form
          action={createRecurringLedgerRuleAction}
          className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">New rule</p>
          <h2 className="mt-2 text-2xl font-semibold">Create monthly automation</h2>
          <div className="mt-4 grid gap-3.5">
            <label className="grid gap-2 text-sm font-medium">
              Rule name
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Category
              <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue="SOFTWARE" name="category">
                {ledger.categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Direction
              <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue="EXPENSE" name="direction">
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Amount
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" min="0.01" name="amount" required step="0.01" type="number" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Day of month
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue="1" max="31" min="1" name="dayOfMonth" required type="number" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Vendor
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="counterparty" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Payment method
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="paymentMethod" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Description
              <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="description" required />
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
          <button className="mt-4 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Save recurring rule
          </button>
        </form>

        <div className="grid gap-4">
          {ledger.recurringRules.map((rule) => (
            <article key={rule.id} className="rounded-[1.4rem] border border-black/[0.08] bg-white/94 p-4.5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
              <form action={updateRecurringLedgerRuleAction} className="grid gap-4">
                <input name="id" type="hidden" value={rule.id} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Monthly rule</p>
                    <h2 className="mt-2 text-xl font-semibold">{rule.name}</h2>
                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                      Next run {shortDate.format(new Date(rule.nextRunDate))}
                      {rule.lastRunDate ? ` | Last run ${shortDate.format(new Date(rule.lastRunDate))}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${rule.active ? "bg-[rgba(47,125,92,0.1)] text-[var(--forest)]" : "bg-black/[0.06] text-[var(--muted)]"}`}>
                    {rule.active ? "Active" : "Paused"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Name
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.name} name="name" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Category
                    <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.category} name="category">
                      {ledger.categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Direction
                    <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.direction} name="direction">
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Amount
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.amount} min="0.01" name="amount" step="0.01" type="number" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Day
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.dayOfMonth} max="31" min="1" name="dayOfMonth" type="number" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Vendor
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.counterparty} name="counterparty" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Payment method
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.paymentMethod} name="paymentMethod" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Description
                    <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.description} name="description" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium md:col-span-2">
                    Link to project
                    <select className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={rule.projectId} name="projectId">
                      <option value="">No linked project</option>
                      {data.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.client} | {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">
                    {rule.categoryLabel} | {preciseCurrencyFormatter.format(rule.amount)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                      Save
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={toggleRecurringLedgerRuleAction}>
                  <input name="id" type="hidden" value={rule.id} />
                  <input name="nextActive" type="hidden" value={rule.active ? "0" : "1"} />
                  <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                    {rule.active ? "Pause rule" : "Resume rule"}
                  </button>
                </form>
                <form action={deleteRecurringLedgerRuleAction}>
                  <input name="id" type="hidden" value={rule.id} />
                  <button className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </div>
    </LedgerWorkspace>
  );
}
