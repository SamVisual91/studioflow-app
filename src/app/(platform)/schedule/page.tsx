import { scheduleZoomMeetingAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { dateTime } from "@/lib/formatters";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ zoom?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { user, data } = await getDashboardPageData();
  const db = getDb();
  const projectContacts = db
    .prepare(
      "SELECT project_contacts.name, project_contacts.email, project_contacts.project_id, projects.name AS project_name, projects.client AS client_name FROM project_contacts JOIN projects ON projects.id = project_contacts.project_id ORDER BY project_contacts.name ASC"
    )
    .all() as Array<{
    name: string;
    email: string;
    project_id: string;
    project_name: string;
    client_name: string;
  }>;
  const contactOptions = [
    ...data.clients
      .map((client) => {
        const project = data.projects.find(
          (item) => item.client === client.name || item.name === client.project
        );

        if (!project?.id || !client.contactEmail) {
          return null;
        }

        return {
          key: `${project.id}|${client.name}|${client.contactEmail}`,
          label: `${client.name} - ${client.contactEmail}`,
          projectName: project.name,
        };
      })
      .filter((item): item is { key: string; label: string; projectName: string } => Boolean(item)),
    ...projectContacts
      .filter((contact) => contact.email)
      .map((contact) => ({
        key: `${contact.project_id}|${contact.client_name}|${contact.email}`,
        label: `${contact.name} - ${contact.email}`,
        projectName: contact.project_name,
      })),
  ].filter(
    (option, index, options) =>
      options.findIndex((item) => item.key.toLowerCase() === option.key.toLowerCase()) === index
  );
  const zoomMeetings = data.schedule.filter(
    (item) => item.meetingUrl || item.type.toLowerCase().includes("zoom")
  );
  const successMessage = query.zoom ? "Zoom meeting scheduled and emailed to the client." : "";
  const errorMessage =
    query.error === "zoom-invalid"
      ? "Choose a client, date/time, and a valid Zoom link before sending."
      : query.error === "smtp-missing"
        ? "SMTP email is not configured yet."
        : query.error === "zoom-send-failed"
          ? "The Zoom meeting email could not be sent."
          : "";

  return (
    <DashboardShell
      currentPath="/schedule"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-8">
        <SectionHeader
          eyebrow="Scheduling"
          title="Scheduling and calendar sync"
          copy="Schedule calls, send Zoom links, and keep each client meeting tied back to the project thread."
        />

        {successMessage ? (
          <div className="rounded-[1.4rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[1.4rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm font-semibold text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(59,36,17,0.10)]">
          <div className="bg-[linear-gradient(135deg,#15100d,#3d2b22)] px-6 py-8 text-white sm:px-8">
            <p className="text-xs uppercase tracking-[0.28em] text-white/58">Zoom meetings</p>
            <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Send a client Zoom link</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Look up a saved client email, paste your Zoom meeting link, choose the date and time, and StudioFlow will email the invite while logging it to that project.
            </p>
          </div>
          <form action={scheduleZoomMeetingAction} className="grid gap-5 p-6 sm:p-8 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Client email
              <select
                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                name="contactKey"
                required
              >
                <option value="">Choose a saved client email</option>
                {contactOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} - {option.projectName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Meeting title
              <input
                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                defaultValue="Planning Zoom Call"
                name="title"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Date and time
              <input
                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                name="startsAt"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Zoom link
              <input
                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                name="zoomUrl"
                placeholder="https://zoom.us/j/..."
                required
                type="url"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold lg:col-span-2">
              Optional message
              <textarea
                className="min-h-28 rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm leading-7"
                name="notes"
                placeholder="Example: We’ll review timeline, locations, and final questions."
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
              <p className="text-xs leading-5 text-[var(--muted)]">
                Tip: create the meeting in Zoom first, then paste the link here. StudioFlow handles the client email and project activity log.
              </p>
              <button className="rounded-full bg-[var(--sidebar)] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:brightness-110">
                Send Zoom invite
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-black/[0.08] bg-white/78 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Friendly reminders</p>
              <h2 className="mt-3 text-3xl font-semibold">Zoom meetings sent to clients</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {zoomMeetings.length} scheduled Zoom invite{zoomMeetings.length === 1 ? "" : "s"}
            </p>
          </div>

          {zoomMeetings.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/[0.12] px-5 py-10 text-sm leading-7 text-[var(--muted)]">
              No Zoom invites have been sent yet. Once you send one from the form above, it will appear here as a client reminder.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {zoomMeetings.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[1.5rem] border border-black/[0.08] bg-white p-5 md:grid-cols-[220px_minmax(0,1fr)]"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Meeting time</p>
                    <p className="mt-2 font-semibold">{dateTime.format(new Date(item.startsAt))}</p>
                    <p className="mt-2 inline-flex rounded-full bg-[rgba(47,125,92,0.1)] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
                      Zoom invite sent
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Reminder for {item.client}
                      {item.recipientEmail ? ` at ${item.recipientEmail}` : ""}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.sync}</p>
                    {item.meetingUrl ? (
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <a
                          className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                          href={item.meetingUrl}
                          target="_blank"
                        >
                          Open Zoom link
                        </a>
                        <span className="text-xs text-[var(--muted)]">
                          Client reminder is already emailed and saved to this schedule.
                        </span>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </DashboardShell>
  );
}
