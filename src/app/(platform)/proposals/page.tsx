import Link from "next/link";
import { createProposalAction } from "@/app/actions";
import { ProposalComposer } from "@/components/proposal-composer";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { currencyFormatter, dateTime, shortDate } from "@/lib/formatters";

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; projectId?: string; presetId?: string }>;
}) {
  const { user, data } = await getDashboardPageData();
  const params = await searchParams;
  const showSent = params.sent === "1";
  const project = params.projectId
    ? data.projects.find((item) => item.id === params.projectId)
    : undefined;
  const projectClient = project
    ? data.clients.find((item) => item.name === project.client)
    : undefined;
  const errorMessage =
    params.error === "smtp-missing"
      ? "SMTP is not configured yet. Add your SMTP settings in .env, then restart the dev server."
      : params.error === "send-failed"
        ? "The proposal could not be emailed. Double-check the recipient address and SMTP credentials."
        : params.error === "proposal-invalid"
          ? "Please fill out every proposal field before sending."
          : "";

  return (
    <DashboardShell
      currentPath="/proposals"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-8">
        <SectionHeader
          eyebrow="Proposals"
          title="Proposals and contracts"
          copy="Create proposals for clients, email them in real time over SMTP, and track what was sent directly in StudioFlow."
        />

        {showSent ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Proposal created and email sent successfully.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
          <div className="grid gap-4">
            <ProposalComposer
              action={createProposalAction}
              initialClient={project?.client || ""}
              initialProjectId={project?.id || ""}
              initialPresetId={params.presetId || ""}
              initialRecipientEmail={projectClient?.contactEmail || ""}
              initialTitle={project ? `${project.name} Proposal` : ""}
              presets={data.packagePresets}
            />

            <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/82 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Saved presets</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Manage your reusable packages on the dedicated Packages page.
                  </p>
                </div>
                <Link
                  className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  href="/packages"
                >
                  Open packages
                </Link>
              </div>
              <div className="mt-4 grid gap-4">
                {data.packagePresets.map((preset) => (
                  <article key={preset.id} className="rounded-2xl bg-black/[0.03] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{preset.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{preset.description}</p>
                      </div>
                      <p className="font-semibold">{currencyFormatter.format(preset.amount)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {data.proposals.map((proposal) => (
              <article
                key={proposal.id}
                className="rounded-[1.75rem] border border-black/[0.08] bg-white/78 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                      {proposal.statusLabel}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold leading-tight">{proposal.title}</h3>
                  </div>
                  <p className="text-lg font-semibold">{currencyFormatter.format(proposal.amount)}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {proposal.client} | Sent {shortDate.format(new Date(proposal.sentDate))} | Expires{" "}
                  {shortDate.format(new Date(proposal.expiresDate))}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                  <p>Recipient: {proposal.recipientEmail || "Not set"}</p>
                  <p>Subject: {proposal.emailSubject || "Not set"}</p>
                  <p>
                    Delivered: {proposal.sentAt ? dateTime.format(new Date(proposal.sentAt)) : "Not sent yet"}
                  </p>
                  {proposal.signatureName ? <p>Signed by: {proposal.signatureName}</p> : null}
                  {proposal.clientComment ? <p>Client note: {proposal.clientComment}</p> : null}
                  {proposal.publicToken ? (
                    <p>
                      Public link:{" "}
                      <Link className="text-[var(--forest)] underline" href={`/p/${proposal.publicToken}`}>
                        /p/{proposal.publicToken}
                      </Link>
                    </p>
                  ) : null}
                  {proposal.publicToken ? (
                    <p>
                      Print view:{" "}
                      <Link className="text-[var(--forest)] underline" href={`/p/${proposal.publicToken}/print`}>
                        /p/{proposal.publicToken}/print
                      </Link>
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2 rounded-2xl bg-black/[0.03] p-4 text-sm text-[var(--muted)]">
                  {proposal.lineItems.map((item, index) => (
                    <div key={`${proposal.id}-${index}`} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                        <p>{item.description}</p>
                      </div>
                      <p className="font-semibold text-[var(--ink)]">
                        {currencyFormatter.format(Number(item.amount))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {proposal.sections.map((section) => (
                    <span
                      key={section}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

      </section>
    </DashboardShell>
  );
}
