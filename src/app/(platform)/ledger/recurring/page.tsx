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
  searchParams: Promise<{ recurring?: string; error?: string }>;
}) {
  const [{ recurring, error }, { user, data, ledger, shellSummary }] = await Promise.all([
    searchParams,
    getLedgerPageData(),
  ]);

  return (
    <LedgerWorkspace
      copy="Set up repeating monthly rules with clear start and end dates, then manage them in one live spreadsheet-style workspace."
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

      {error === "transaction-invalid" ? (
        <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
          Add a valid name, amount, description, and date range before saving the recurring rule.
        </div>
      ) : null}

      <form
        action={createRecurringLedgerRuleAction}
        className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">New rule</p>
            <h2 className="mt-2 text-2xl font-semibold">Create monthly automation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Pick the monthly amount, the first run date, and the final month it should stay active. You can edit the
              date range later right from the recurring spreadsheet below.
            </p>
          </div>
          <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Save recurring rule
          </button>
        </div>

        <div className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium xl:col-span-2">
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
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              min="0.01"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Start date
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={new Date().toISOString().slice(0, 10)}
              name="startDate"
              required
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            End date
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 11)).toISOString().slice(0, 10)}
              name="endDate"
              required
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Vendor
            <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="counterparty" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Payment method
            <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="paymentMethod" />
          </label>
          <label className="grid gap-2 text-sm font-medium xl:col-span-2">
            Description
            <input className="rounded-2xl border border-black/[0.08] px-4 py-3" name="description" required />
          </label>
          <label className="grid gap-2 text-sm font-medium xl:col-span-2">
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
      </form>

      <section className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Monthly rules</p>
            <h2 className="mt-2 text-2xl font-semibold">Live recurring spreadsheet</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Every row stays editable. Change the amount, date range, project link, or description here and save the
              row without leaving the page.
            </p>
          </div>
          <div className="rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-4 py-3 text-sm text-[var(--muted)]">
            Active rules keep posting monthly until the end date
          </div>
        </div>

        {ledger.recurringRules.length === 0 ? (
          <div className="mt-5 rounded-[1.2rem] border border-dashed border-black/[0.12] bg-[rgba(247,241,232,0.46)] px-4 py-6 text-sm text-[var(--muted)]">
            No recurring rules yet. Create your first monthly rule above and it will appear here.
          </div>
        ) : (
          <div className="mt-5 grid gap-3.5">
            {ledger.recurringRules.map((rule) => {
              const updateFormId = `rule-form-${rule.id}`;
              const activeClass = rule.active
                ? "border-[rgba(47,125,92,0.16)] bg-[rgba(47,125,92,0.05)]"
                : "border-black/[0.08] bg-[rgba(16,33,52,0.03)]";

              return (
                <article key={rule.id} className={`rounded-[1.15rem] border p-4 ${activeClass}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            rule.active
                              ? "bg-[rgba(47,125,92,0.1)] text-[var(--forest)]"
                              : "bg-black/[0.06] text-[var(--muted)]"
                          }`}
                        >
                          {rule.active ? "Active" : "Paused"}
                        </span>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{rule.categoryLabel}</p>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{rule.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {rule.direction === "EXPENSE" ? "Expense" : "Income"} | {preciseCurrencyFormatter.format(rule.amount)} | Next run{" "}
                        {shortDate.format(new Date(rule.nextRunDate))}
                      </p>
                    </div>

                    <div className="flex min-w-[190px] flex-col gap-2 sm:min-w-[220px]">
                      <form action={updateRecurringLedgerRuleAction} id={updateFormId}>
                        <input name="id" type="hidden" value={rule.id} />
                      </form>
                      <button
                        className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                        form={updateFormId}
                      >
                        Save row
                      </button>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <form action={toggleRecurringLedgerRuleAction}>
                          <input name="id" type="hidden" value={rule.id} />
                          <input name="nextActive" type="hidden" value={rule.active ? "0" : "1"} />
                          <button className="w-full rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                            {rule.active ? "Pause" : "Resume"}
                          </button>
                        </form>
                        <form action={deleteRecurringLedgerRuleAction}>
                          <input name="id" type="hidden" value={rule.id} />
                          <button className="w-full rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Rule name
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.name}
                        form={updateFormId}
                        name="name"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Category
                      <select
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.category}
                        form={updateFormId}
                        name="category"
                      >
                        {ledger.categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Direction
                      <select
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.direction}
                        form={updateFormId}
                        name="direction"
                      >
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Amount
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.amount}
                        form={updateFormId}
                        min="0.01"
                        name="amount"
                        step="0.01"
                        type="number"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Start date
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.startDate}
                        form={updateFormId}
                        name="startDate"
                        type="date"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      End date
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.endDate}
                        form={updateFormId}
                        name="endDate"
                        type="date"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Vendor
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.counterparty}
                        form={updateFormId}
                        name="counterparty"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Method
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.paymentMethod}
                        form={updateFormId}
                        name="paymentMethod"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:col-span-2 xl:col-span-3">
                      Description
                      <input
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.description}
                        form={updateFormId}
                        name="description"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:col-span-2 xl:col-span-1">
                      Project
                      <select
                        className="h-11 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--ink)]"
                        defaultValue={rule.projectId}
                        form={updateFormId}
                        name="projectId"
                      >
                        <option value="">No linked project</option>
                        {data.projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.client} | {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-[1rem] bg-white/72 px-3.5 py-3 text-sm text-[var(--muted)] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[var(--ink)]">Next run:</span>{" "}
                      {shortDate.format(new Date(rule.nextRunDate))}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--ink)]">Last run:</span>{" "}
                      {rule.lastRunDate ? shortDate.format(new Date(rule.lastRunDate)) : "Not run yet"}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--ink)]">Range:</span> {rule.startDate} to {rule.endDate}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </LedgerWorkspace>
  );
}
