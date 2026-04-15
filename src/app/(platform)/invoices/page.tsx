import Link from "next/link";
import { sendProjectInvoiceEmailAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { currencyFormatter, shortDate } from "@/lib/formatters";

type PaymentScheduleItem = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  invoiceNumber: string;
};

function isPaidStatus(status: string) {
  return status.toUpperCase() === "PAID";
}

function isProcessingStatus(status: string) {
  return ["PROCESSING", "SUBMITTED"].includes(status.toUpperCase());
}

function isOverduePayment(payment: PaymentScheduleItem, today: Date) {
  return !isPaidStatus(payment.status) && new Date(payment.dueDate) < today;
}

function getMonthKey(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(value));
}

export default async function InvoicesPage() {
  const { user, data } = await getDashboardPageData();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const invoicesWithProject = data.invoices.map((invoice) => ({
    ...invoice,
    project: data.projects.find((project) => project.client === invoice.client) ?? null,
  }));
  const unpaidInvoices = invoicesWithProject.filter((invoice) => invoice.status !== "PAID");
  const paidRevenue = invoicesWithProject
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const openRevenue = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueInvoices = unpaidInvoices.filter(
    (invoice) =>
      invoice.status === "OVERDUE" ||
      invoice.paymentSchedule.some((payment: PaymentScheduleItem) => isOverduePayment(payment, today))
  );
  const processingPayments = invoicesWithProject.flatMap((invoice) =>
    invoice.paymentSchedule
      .filter((payment: PaymentScheduleItem) => isProcessingStatus(payment.status))
      .map((payment: PaymentScheduleItem) => ({ ...payment, invoice }))
  );
  const upcomingPayments = invoicesWithProject
    .flatMap((invoice) =>
      invoice.paymentSchedule
        .filter((payment: PaymentScheduleItem) => !isPaidStatus(payment.status))
        .map((payment: PaymentScheduleItem) => ({ ...payment, invoice }))
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const nextPayments = upcomingPayments.slice(0, 5);
  const currentMonthPaid = invoicesWithProject
    .flatMap((invoice) =>
      invoice.paymentSchedule
        .filter((payment: PaymentScheduleItem) => {
          const dueDate = new Date(payment.dueDate);
          return isPaidStatus(payment.status) && dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        })
        .map((payment: PaymentScheduleItem) => payment.amount)
    )
    .reduce((sum, amount) => sum + amount, 0);
  const currentMonthUpcoming = upcomingPayments
    .filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear && !isOverduePayment(payment, today);
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
  const currentMonthOverdue = upcomingPayments
    .filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear && isOverduePayment(payment, today);
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
  const timelineMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth + index, 1);
    const month = getMonthKey(date.toISOString());
    const paid = invoicesWithProject
      .flatMap((invoice) => invoice.paymentSchedule)
      .filter((payment: PaymentScheduleItem) => {
        const dueDate = new Date(payment.dueDate);
        return isPaidStatus(payment.status) && dueDate.getMonth() === date.getMonth() && dueDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, payment: PaymentScheduleItem) => sum + payment.amount, 0);
    const expected = invoicesWithProject
      .flatMap((invoice) => invoice.paymentSchedule)
      .filter((payment: PaymentScheduleItem) => {
        const dueDate = new Date(payment.dueDate);
        return !isPaidStatus(payment.status) && dueDate.getMonth() === date.getMonth() && dueDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, payment: PaymentScheduleItem) => sum + payment.amount, 0);

    return { month, paid, expected };
  });
  const maxTimelineValue = Math.max(...timelineMonths.map((month) => month.paid + month.expected), 1);
  const autoPayInvoices = invoicesWithProject.filter((invoice) => invoice.autoPayEnabled);

  return (
    <DashboardShell
      currentPath="/invoices"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Invoice Center"
            title="Invoice Center"
            copy="Manage every client invoice, upcoming payment, overdue balance, and auto-pay setup from one clean command center."
          />
          <Link
            className="rounded-full bg-[var(--forest)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110"
            href="/projects"
          >
            Create from project
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Collected</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{currencyFormatter.format(paidRevenue)}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Paid invoices across all projects.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Open receivables</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{currencyFormatter.format(openRevenue)}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{unpaidInvoices.length} invoices still open.</p>
          </article>
          <article className="border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.07)] p-5 shadow-[0_14px_36px_rgba(31,27,24,0.04)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Overdue</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--accent)]">{overdueInvoices.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Invoices needing attention.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Auto-pay</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{autoPayInvoices.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Invoices with saved-card billing enabled.</p>
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Payment tracking</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">This month</h2>
              </div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                {currencyFormatter.format(currentMonthPaid + currentMonthUpcoming + currentMonthOverdue)}
              </p>
            </div>

            <div className="mt-5 h-3 overflow-hidden bg-black/[0.06]">
              {[
                ["bg-[var(--forest)]", currentMonthPaid],
                ["bg-[rgba(218,139,57,0.9)]", processingPayments.reduce((sum, payment) => sum + payment.amount, 0)],
                ["bg-black/20", currentMonthUpcoming],
                ["bg-[var(--accent)]", currentMonthOverdue],
              ].map(([color, amount], index) => {
                const total = currentMonthPaid + currentMonthUpcoming + currentMonthOverdue + processingPayments.reduce((sum, payment) => sum + payment.amount, 0);
                const width = total > 0 ? (Number(amount) / total) * 100 : 0;
                return <div className={`inline-block h-full ${color}`} key={`${color}-${index}`} style={{ width: `${width}%` }} />;
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                ["Deposited", currentMonthPaid, "bg-[var(--forest)]"],
                ["Processing", processingPayments.reduce((sum, payment) => sum + payment.amount, 0), "bg-[rgba(218,139,57,0.9)]"],
                ["Upcoming", currentMonthUpcoming, "bg-black/25"],
                ["Overdue", currentMonthOverdue, "bg-[var(--accent)]"],
              ].map(([label, amount, color]) => (
                <div className="border border-black/[0.06] bg-white p-3" key={String(label)}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{currencyFormatter.format(Number(amount))}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Next collections</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Upcoming payments</h2>
            <div className="mt-5 grid gap-3">
              {nextPayments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No upcoming payments on the schedule right now.</p>
              ) : (
                nextPayments.map((payment) => (
                  <div className="border border-black/[0.06] bg-white p-4" key={`${payment.invoice.id}-${payment.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{payment.invoice.client}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {payment.invoiceNumber || payment.invoice.label} due {shortDate.format(new Date(payment.dueDate))}
                        </p>
                      </div>
                      <p className="font-semibold text-[var(--ink)]">{currencyFormatter.format(payment.amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Revenue timeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Paid vs expected</h2>
            </div>
            <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href="/ledger/accounts-receivable">
              Open accounts receivable
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-6">
            {timelineMonths.map((month) => (
              <div className="grid gap-3 border border-black/[0.06] bg-white p-4" key={month.month}>
                <p className="text-sm font-semibold text-[var(--ink)]">{month.month}</p>
                <div className="flex h-28 items-end gap-2 border-b border-black/[0.08] pb-2">
                  <span
                    className="w-full bg-[var(--forest)]"
                    style={{ height: `${Math.max((month.paid / maxTimelineValue) * 100, month.paid > 0 ? 8 : 0)}%` }}
                    title={`Paid ${currencyFormatter.format(month.paid)}`}
                  />
                  <span
                    className="w-full bg-black/20"
                    style={{ height: `${Math.max((month.expected / maxTimelineValue) * 100, month.expected > 0 ? 8 : 0)}%` }}
                    title={`Expected ${currencyFormatter.format(month.expected)}`}
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">Paid {currencyFormatter.format(month.paid)}</p>
                <p className="text-xs text-[var(--muted)]">Expected {currencyFormatter.format(month.expected)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Invoice list</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Manage invoices</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">{invoicesWithProject.length} total invoices</p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead className="border-b border-black/[0.06] bg-[#fbf8f3] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold">Client</th>
                  <th className="px-4 py-4 font-semibold">Invoice</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Due</th>
                  <th className="px-4 py-4 font-semibold">Method</th>
                  <th className="px-4 py-4 text-right font-semibold">Amount</th>
                  <th className="px-4 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoicesWithProject.map((invoice) => (
                  <tr className="border-t border-black/[0.05] transition hover:bg-[#fbf8f3]" key={invoice.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-[var(--ink)]">{invoice.client}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{invoice.label}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${
                          invoice.status === "PAID"
                            ? "border-[rgba(47,125,92,0.28)] bg-[rgba(47,125,92,0.1)] text-[var(--forest)]"
                            : invoice.status === "OVERDUE"
                              ? "border-[rgba(207,114,79,0.28)] bg-[rgba(207,114,79,0.1)] text-[var(--accent)]"
                              : "border-black/[0.08] bg-white text-[var(--ink)]"
                        }`}
                      >
                        {invoice.statusLabel || invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--ink)]">{shortDate.format(new Date(invoice.dueDate))}</td>
                    <td className="px-4 py-4 text-sm text-[var(--ink)]">{invoice.method}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--ink)]">
                      {currencyFormatter.format(invoice.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {invoice.project ? (
                          <Link
                            className="border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                            href={`/projects/${invoice.project.id}/invoices/${invoice.id}`}
                          >
                            Open
                          </Link>
                        ) : null}
                        {invoice.publicToken ? (
                          <Link
                            className="border border-black/[0.08] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                            href={`/invoice/${invoice.publicToken}`}
                          >
                            Client view
                          </Link>
                        ) : null}
                        {invoice.project ? (
                          <form action={sendProjectInvoiceEmailAction}>
                            <input name="projectId" type="hidden" value={invoice.project.id} />
                            <input name="invoiceId" type="hidden" value={invoice.id} />
                            <button className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-3 py-2 text-xs font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.14)]">
                              Resend
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoicesWithProject.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-sm text-[var(--muted)]" colSpan={7}>
                      No invoices yet. Create one from a client project to start tracking payments here.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
