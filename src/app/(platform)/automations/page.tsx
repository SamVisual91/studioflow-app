import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";

export default async function AutomationsPage() {
  const { user, data } = await getDashboardPageData();

  return (
    <DashboardShell
      currentPath="/automations"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-8">
        <SectionHeader
          eyebrow="Automations"
          title="Reminders, workflows, and follow-ups"
          copy="Automation rules are persisted too, giving you a real place to hang reminder engines and workflow triggers next."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {data.automations.map((automation) => (
            <article
              key={automation.id}
              className="rounded-[1.75rem] border border-black/[0.08] bg-white/78 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                    {automation.statusLabel}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{automation.name}</h3>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                  Trigger
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{automation.trigger}</p>
              <div className="mt-5 grid gap-3">
                {automation.actions.map((action) => (
                  <div key={action} className="rounded-2xl bg-black/[0.04] px-4 py-3 text-sm text-[var(--muted)]">
                    {action}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
