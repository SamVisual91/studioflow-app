import Link from "next/link";
import { sendFollowUpMessageAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getFollowUpProjects } from "@/lib/follow-ups";
import { shortDate } from "@/lib/formatters";

function formatProjectDate(projectDate: string) {
  if (!projectDate) {
    return "Date not set";
  }

  const date = new Date(`${projectDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date not set" : shortDate.format(date);
}

function getFollowUpTemplate({
  client,
  name,
  type,
}: {
  client: string;
  name: string;
  type: string;
}) {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("wedding")) {
    return {
      label: "Wedding follow-up",
      subject: `Checking in on your wedding film for ${name}`,
      body: `Hi ${client},

I wanted to follow up on ${name}. I would love to help capture your wedding day and make sure you feel clear on the next steps.

If you have any questions about the collections, timeline, contract, or payment plan, just reply here and I will help you through it.

Thanks,
Sam Visual`,
    };
  }

  if (normalizedType.includes("business")) {
    return {
      label: "Business follow-up",
      subject: `Checking in on ${name}`,
      body: `Hi ${client},

I wanted to follow up on ${name}. I would love to help bring this photo/video project together and make sure the deliverables line up with your business goals.

If you have any questions about scope, timeline, pricing, or next steps, just reply here and I will help you move it forward.

Thanks,
Sam Visual`,
    };
  }

  return {
    label: "General follow-up",
    subject: `Following up on ${name}`,
    body: `Hi ${client},

I wanted to follow up on ${name}. If you have any questions or want to move forward, just reply here and I will help with next steps.

Thanks,
Sam Visual`,
  };
}

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
}) {
  const { user, data } = await getDashboardPageData();
  const params = await searchParams;
  const followUps = getFollowUpProjects(data);
  const missingEmailCount = followUps.filter((project) => !project.contactEmail).length;
  const errorMessage =
    params.error === "smtp-missing"
      ? "SMTP is not configured yet. Add your Gmail settings in .env, restart the app, and try again."
      : params.error === "follow-up-send-failed"
        ? "The follow-up email could not be sent. Double-check your email settings and try again."
        : params.error === "follow-up-invalid"
          ? "That follow-up is missing a client, project, email address, subject, or message."
          : "";

  return (
    <DashboardShell
      currentPath="/overview"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="rounded-[2rem] border border-black/[0.08] bg-white/88 p-6 shadow-[0_22px_60px_rgba(59,36,17,0.09)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Follow-ups"
            title="Clients who still need a nudge."
            copy="New projects stay here until the client signs a proposal/contract or makes a payment. Send a quick follow-up without digging through each project."
          />
          <Link
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
            href="/overview"
          >
            Back to Home
          </Link>
        </div>

        {params.sent === "1" ? (
          <div className="mt-6 rounded-[1.1rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm font-semibold text-[var(--forest)]">
            Follow-up email sent and logged in the project activity thread.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-[1.1rem] border border-[rgba(207,114,79,0.28)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            { label: "Needs follow-up", value: String(followUps.length), note: "Active clients not signed or paid" },
            { label: "Ready to email", value: String(followUps.length - missingEmailCount), note: "Clients with contact emails" },
            { label: "Missing email", value: String(missingEmailCount), note: "Open project to add contact info" },
          ].map((card) => (
            <article key={card.label} className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.56)] p-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1.5 text-sm text-[var(--muted)]">{card.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[1.7rem] border border-black/[0.08] bg-white/88 p-5 shadow-[0_18px_45px_rgba(59,36,17,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Follow-up queue</p>
            <h2 className="mt-2 text-2xl font-semibold">Clients waiting on next steps</h2>
          </div>
          <p className="rounded-full bg-[rgba(47,125,92,0.08)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
            {followUps.length} open
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {followUps.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-black/15 bg-[rgba(247,241,232,0.45)] p-8 text-center">
              <p className="text-lg font-semibold">No follow-ups needed right now.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Once a new project is created, it will appear here until the client signs or pays.
              </p>
            </div>
          ) : (
            followUps.map((project) => {
              const template = getFollowUpTemplate(project);

              return (
                <article
                  key={project.id}
                  className="grid gap-4 rounded-[1.25rem] border border-black/[0.08] bg-white p-4 transition hover:border-[var(--forest)] hover:shadow-[0_14px_35px_rgba(59,36,17,0.08)] lg:grid-cols-[1.2fr_0.85fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="text-lg font-semibold transition hover:text-[var(--forest)]"
                        href={`/projects/${project.id}?tab=activity`}
                      >
                        {project.client}
                      </Link>
                      <span className="rounded-full border border-black/[0.08] bg-[rgba(247,241,232,0.7)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {project.phase}
                      </span>
                      <span className="rounded-full border border-[rgba(47,125,92,0.18)] bg-[rgba(47,125,92,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                        {template.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {project.name} {" · "} {project.type || "Project"} {" · "} {formatProjectDate(project.projectDate)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {project.nextMilestone || project.recentActivity || "No recent activity recorded yet."}
                    </p>
                  </div>

                  <div className="rounded-[1rem] bg-[rgba(247,241,232,0.55)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Contact</p>
                    {project.contactEmail ? (
                      <p className="mt-2 break-words text-sm font-semibold">{project.contactEmail}</p>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-[var(--accent)]">Missing email</p>
                    )}
                    <Link
                      className="mt-3 inline-flex text-sm font-semibold text-[var(--forest)] hover:underline"
                      href={`/projects/${project.id}?tab=activity`}
                    >
                      Open activity
                    </Link>
                  </div>

                  <details className="rounded-[1rem] border border-black/[0.08] bg-[rgba(247,241,232,0.38)] p-4 lg:col-span-2">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
                      Customize & send follow-up
                    </summary>
                    <form action={sendFollowUpMessageAction} className="mt-4 grid gap-4">
                      <input name="projectId" type="hidden" value={project.id} />
                      <input name="projectName" type="hidden" value={project.name} />
                      <input name="clientName" type="hidden" value={project.client} />
                      <input name="recipientEmail" type="hidden" value={project.contactEmail} />

                      <label className="grid gap-2 text-sm font-semibold">
                        Subject
                        <input
                          className="rounded-[0.9rem] border border-black/[0.08] bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--forest)]"
                          name="subject"
                          defaultValue={template.subject}
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-semibold">
                        Message
                        <textarea
                          className="min-h-44 rounded-[0.9rem] border border-black/[0.08] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forest)]"
                          name="body"
                          defaultValue={template.body}
                        />
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-[var(--muted)]">
                          This message is pre-filled for {project.type || "this project"} clients, but you can edit it before sending.
                        </p>
                        <button
                          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(47,125,92,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-black/20 disabled:shadow-none"
                          disabled={!project.contactEmail}
                          type="submit"
                        >
                          Send automated follow-up
                        </button>
                      </div>
                    </form>
                  </details>
                </article>
              );
            })
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
