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
          <div className="mt-5 overflow-x-auto rounded-[1.15rem] border border-black/[0.08]">
            <table className="min-w-[1500px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[rgba(16,33,52,0.06)] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Status</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Rule</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Category</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Direction</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Amount</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Start date</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">End date</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Vendor</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Method</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Description</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Project</th>
                  <th className="border-b border-r border-black/[0.08] px-3 py-3 font-medium">Next run</th>
                  <th className="border-b border-black/[0.08] px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.recurringRules.map((rule) => {
                  const updateFormId = `rule-form-${rule.id}`;
                  const activeClass = rule.active
                    ? "bg-[rgba(47,125,92,0.08)]"
                    : "bg-[rgba(16,33,52,0.03)] text-[var(--muted)]";

                  return (
                    <tr key={rule.id} className={activeClass}>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            rule.active
                              ? "bg-[rgba(47,125,92,0.1)] text-[var(--forest)]"
                              : "bg-black/[0.06] text-[var(--muted)]"
                          }`}
                        >
                          {rule.active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[180px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.name}
                          form={updateFormId}
                          name="name"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <select
                          className="w-[170px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
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
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <select
                          className="w-[130px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.direction}
                          form={updateFormId}
                          name="direction"
                        >
                          <option value="EXPENSE">Expense</option>
                          <option value="INCOME">Income</option>
                        </select>
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[110px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.amount}
                          form={updateFormId}
                          min="0.01"
                          name="amount"
                          step="0.01"
                          type="number"
                        />
                        <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                          {preciseCurrencyFormatter.format(rule.amount)}
                        </p>
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[150px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.startDate}
                          form={updateFormId}
                          name="startDate"
                          type="date"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[150px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.endDate}
                          form={updateFormId}
                          name="endDate"
                          type="date"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[160px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.counterparty}
                          form={updateFormId}
                          name="counterparty"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[150px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.paymentMethod}
                          form={updateFormId}
                          name="paymentMethod"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <input
                          className="w-[220px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
                          defaultValue={rule.description}
                          form={updateFormId}
                          name="description"
                        />
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <select
                          className="w-[200px] rounded-2xl border border-black/[0.08] bg-white px-3 py-2"
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
                      </td>
                      <td className="border-b border-r border-black/[0.08] px-3 py-3 align-top">
                        <p className="font-semibold">{shortDate.format(new Date(rule.nextRunDate))}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {rule.lastRunDate ? `Last ${shortDate.format(new Date(rule.lastRunDate))}` : "Not run yet"}
                        </p>
                      </td>
                      <td className="border-b border-black/[0.08] px-3 py-3 align-top">
                        <div className="flex min-w-[180px] flex-col gap-2">
                          <form action={updateRecurringLedgerRuleAction} id={updateFormId}>
                            <input name="id" type="hidden" value={rule.id} />
                          </form>
                          <button
                            className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                            form={updateFormId}
                          >
                            Save row
                          </button>
                          <form action={toggleRecurringLedgerRuleAction}>
                            <input name="id" type="hidden" value={rule.id} />
                            <input name="nextActive" type="hidden" value={rule.active ? "0" : "1"} />
                            <button className="w-full rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                              {rule.active ? "Pause rule" : "Resume rule"}
                            </button>
                          </form>
                          <form action={deleteRecurringLedgerRuleAction}>
                            <input name="id" type="hidden" value={rule.id} />
                            <button className="w-full rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </LedgerWorkspace>
  );
}
