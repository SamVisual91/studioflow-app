import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { currencyFormatter, dateTime } from "@/lib/formatters";

export default async function LeadsPage() {
  const { user, data } = await getDashboardPageData();
  const leads = [...data.leads].sort((a, b) => {
    const aTime = new Date(a.eventDate).getTime();
    const bTime = new Date(b.eventDate).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  const inquiryCount = leads.filter((lead) => lead.stage === "INQUIRY").length;
  const totalPipeline = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);

  return (
    <DashboardShell
      currentPath="/leads"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-7">
        <SectionHeader
          eyebrow="Leads"
          title="Website inquiries"
          copy="Review every inquiry captured from your public contact form, including source, service, event date, and the notes that were saved into the app."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Total leads</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{leads.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Everything captured through the site and API.</p>
          </article>
          <article className="border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.07)] p-5 shadow-[0_14px_36px_rgba(31,27,24,0.04)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">New inquiries</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--accent)]">{inquiryCount}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Fresh website leads waiting for your follow-up.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Pipeline value</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{currencyFormatter.format(totalPipeline)}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Budget values captured from inquiry submissions.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Sources</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{new Set(leads.map((lead) => lead.source)).size}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Unique lead sources currently represented.</p>
          </article>
        </div>

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Lead log</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">All captured inquiries</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">Newest event dates appear first.</p>
          </div>

          <div className="mt-6 grid gap-4">
            {leads.length === 0 ? (
              <div className="border border-black/[0.06] bg-white p-5">
                <p className="text-sm text-[var(--muted)]">No leads have been saved yet.</p>
              </div>
            ) : (
              leads.map((lead) => (
                <article className="border border-black/[0.06] bg-white p-5 shadow-[0_8px_26px_rgba(31,27,24,0.04)]" key={lead.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold text-[var(--ink)]">{lead.name}</p>
                        <span className="rounded-full bg-[rgba(207,114,79,0.12)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                          {lead.stageLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {lead.service} • {lead.source}
                      </p>
                    </div>
                    <div className="grid gap-1 text-sm text-[var(--muted)] lg:text-right">
                      <p>
                        <span className="font-semibold text-[var(--ink)]">Event date:</span>{" "}
                        {dateTime.format(new Date(lead.eventDate))}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--ink)]">Budget:</span>{" "}
                        {lead.value > 0 ? currencyFormatter.format(lead.value) : "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-[1.1rem] border border-black/[0.06] bg-[#fbf8f3] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Inquiry notes</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{lead.notes}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
