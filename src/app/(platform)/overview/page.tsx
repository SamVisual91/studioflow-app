import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDb } from "@/lib/db";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getFollowUpProjects } from "@/lib/follow-ups";
import { currencyFormatter, dateTime } from "@/lib/formatters";
import { getLedgerData } from "@/lib/ledger";

function isInCurrentMonth(dateValue: string, monthStart: Date, nextMonthStart: Date) {
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime()) && date >= monthStart && date < nextMonthStart;
}

function getTimeOfDayGreeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    }).format(date)
  );

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export default async function HomePage() {
  const { user, data } = await getDashboardPageData();
  const ledger = getLedgerData();
  const db = getDb();
  const today = new Date();
  const greeting = getTimeOfDayGreeting(today);
  const currentYear = today.getFullYear();
  const todayStart = new Date(today);
  const tomorrowStart = new Date(today);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextSevenDays = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  currentMonthStart.setHours(0, 0, 0, 0);
  nextMonthStart.setHours(0, 0, 0, 0);
  nextSevenDays.setDate(nextSevenDays.getDate() + 7);
  nextSevenDays.setHours(23, 59, 59, 999);

  const currentYearBookings = ledger.entries
    .filter((entry) => {
      const transactionDate = new Date(entry.transactionDate);

      return (
        entry.direction === "INCOME" &&
        Boolean(entry.invoiceId) &&
        transactionDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  const followUpProjects = getFollowUpProjects(data);
  const currentMonthDeposited = ledger.entries
    .filter(
      (entry) =>
        entry.direction === "INCOME" &&
        Boolean(entry.invoiceId) &&
        isInCurrentMonth(entry.transactionDate, currentMonthStart, nextMonthStart)
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  const paymentSnapshot = data.invoices.reduce(
    (totals, invoice) => {
      const schedule =
        invoice.paymentSchedule.length > 0
          ? invoice.paymentSchedule
          : [
              {
                id: invoice.id,
                amount: invoice.amount,
                dueDate: invoice.dueDate,
                status: invoice.status,
                invoiceNumber: invoice.label,
              },
            ];

      schedule.forEach((payment) => {
        if (!isInCurrentMonth(payment.dueDate, currentMonthStart, nextMonthStart)) {
          return;
        }

        if (payment.status === "PAID") {
          return;
        }

        const dueDate = new Date(`${payment.dueDate}T00:00:00`);
        const amount = Number(payment.amount || 0);
        const status = payment.status.toUpperCase();

        if (status.includes("PROCESS") || status.includes("SUBMITTED")) {
          totals.processing += amount;
          return;
        }

        if (status === "OVERDUE" || (!Number.isNaN(dueDate.getTime()) && dueDate < todayStart)) {
          totals.overdue += amount;
          return;
        }

        totals.upcoming += amount;
      });

      return totals;
    },
    {
      deposited: currentMonthDeposited,
      processing: 0,
      upcoming: 0,
      overdue: 0,
    }
  );

  const currentMonthGrossPayments =
    paymentSnapshot.deposited +
    paymentSnapshot.processing +
    paymentSnapshot.upcoming +
    paymentSnapshot.overdue;

  const paymentSegments = [
    {
      label: "Deposited",
      value: paymentSnapshot.deposited,
      className: "bg-[var(--forest)]",
      dotClassName: "bg-[var(--forest)]",
    },
    {
      label: "Processing",
      value: paymentSnapshot.processing,
      className: "bg-[#d8a657]",
      dotClassName: "bg-[#d8a657]",
    },
    {
      label: "Upcoming",
      value: paymentSnapshot.upcoming,
      className: "bg-[#9ca3af]",
      dotClassName: "bg-[#9ca3af]",
    },
    {
      label: "Overdue",
      value: paymentSnapshot.overdue,
      className: "bg-[#b42318]",
      dotClassName: "bg-[#b42318]",
    },
  ];

  const unreadClientMessages = data.messages.filter(
    (message) => message.unread && message.direction === "INBOUND" && message.projectId
  );

  const todaySchedule = data.schedule
    .filter((item) => {
      const startsAt = new Date(item.startsAt);
      return startsAt >= todayStart && startsAt < tomorrowStart;
    })
    .slice(0, 5);

  const upcomingWeekSchedule = data.schedule
    .filter((item) => {
      const startsAt = new Date(item.startsAt);
      return startsAt >= todayStart && startsAt <= nextSevenDays;
    })
    .slice(0, 6);

  const projectDeliverables = db
    .prepare(
      `SELECT project_id AS projectId, COUNT(*) AS deliverableCount
       FROM project_deliverables
       GROUP BY project_id`
    )
    .all() as Array<{ projectId: string; deliverableCount: number }>;
  const deliverableMap = new Map(
    projectDeliverables.map((row) => [String(row.projectId), Number(row.deliverableCount || 0)])
  );

  const pendingDeliveries = data.projects
    .filter((project) => {
      if (!project.projectDate || project.phase === "Completed") {
        return false;
      }

      const projectDate = new Date(project.projectDate);
      return projectDate < todayStart && (deliverableMap.get(project.id) || 0) === 0;
    })
    .slice(0, 6);

  const activeGearCheckouts = db
    .prepare(
      `SELECT
        gear_inventory.name,
        gear_inventory.current_holder,
        gear_inventory.due_back_at,
        gear_inventory.status
      FROM gear_inventory
      WHERE gear_inventory.status != 'AVAILABLE'
      ORDER BY gear_inventory.due_back_at ASC`
    )
    .all() as Array<{
      name: string;
      current_holder: string | null;
      due_back_at: string | null;
      status: string;
    }>;

  const gearAlerts = activeGearCheckouts
    .filter((gear) => {
      if (!gear.due_back_at) {
        return true;
      }

      const dueBack = new Date(gear.due_back_at);
      return dueBack <= nextSevenDays;
    })
    .slice(0, 6);

  const attentionItems = [
    {
      label: "New inquiries",
      value: data.leads.filter((lead) => lead.stage === "INQUIRY").length,
      href: "/leads",
    },
    {
      label: "Unread client replies",
      value: unreadClientMessages.length,
      href: unreadClientMessages[0]?.projectId ? `/projects/${unreadClientMessages[0].projectId}?tab=activity` : "/messages",
    },
    {
      label: "Overdue invoices",
      value: data.invoices.filter((invoice) => invoice.status === "OVERDUE").length,
      href: "/invoices",
    },
    {
      label: "Pending deliveries",
      value: pendingDeliveries.length,
      href: pendingDeliveries[0] ? `/projects/${pendingDeliveries[0].id}/deliverables` : "/projects",
    },
    {
      label: "Gear due back soon",
      value: gearAlerts.length,
      href: "/crm",
    },
  ].filter((item) => item.value > 0);

  const statCards = [
    {
      label: `${currentYear} Bookings`,
      value: currencyFormatter.format(currentYearBookings),
      meta: "Paid client invoice income collected this year",
    },
    {
      label: "Follow-ups",
      value: String(followUpProjects.length),
      meta: "New projects stay here until the client signs or pays",
      href: "/follow-ups",
    },
    {
      label: "Outstanding",
      value: currencyFormatter.format(data.stats.outstandingRevenue),
      meta: "Receivables still waiting to be collected",
      href: "/invoices",
    },
    {
      label: "Payments",
      value: currencyFormatter.format(currentMonthGrossPayments),
      meta: "Current month gross payments",
      segments: paymentSegments,
      href: "/invoices",
    },
  ];

  const recentInquiries = [...data.leads]
    .sort((a, b) => {
      const aTime = new Date(a.eventDate).getTime();
      const bTime = new Date(b.eventDate).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, 5);

  return (
    <DashboardShell
      currentPath="/overview"
      user={user}
    >
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(255,248,240,0.72))] p-6 shadow-[0_24px_80px_rgba(58,34,17,0.12)] sm:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                Home
              </p>
              <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">
                {greeting}, {user.name}.
              </h2>
              <form action="/projects" className="mt-6 max-w-2xl" method="get">
                <label className="flex items-center gap-3 rounded-full border border-black/[0.08] bg-white/82 px-5 py-3 text-sm text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus-within:border-[var(--forest)] focus-within:bg-white">
                  <span aria-hidden="true">Search</span>
                  <input
                    className="w-full bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                    name="q"
                    placeholder="Search clients, projects, type, or source"
                  />
                </label>
              </form>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <Link
                className="rounded-full bg-[var(--forest)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110"
                href="/projects"
              >
                Projects
              </Link>
              <Link
                className="rounded-full border border-black/10 bg-white/80 px-5 py-3 text-center text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
                href="/schedule"
              >
                Schedule
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((card) => {
              const segments = "segments" in card ? card.segments : undefined;
              const content = (
                <>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{card.meta}</p>
                  {segments ? (
                    <div className="mt-4">
                      <div className="flex h-2 overflow-hidden rounded-full bg-black/[0.06]">
                        {segments.map((segment) => {
                          const width =
                            currentMonthGrossPayments > 0
                              ? Math.max((segment.value / currentMonthGrossPayments) * 100, segment.value > 0 ? 5 : 0)
                              : 0;

                          return (
                            <span
                              key={segment.label}
                              aria-label={`${segment.label}: ${currencyFormatter.format(segment.value)}`}
                              className={segment.className}
                              style={{ width: `${width}%` }}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
                        {segments.map((segment) => (
                          <div key={segment.label} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${segment.dotClassName}`} />
                              {segment.label}
                            </span>
                            <span className="font-semibold text-[var(--ink)]">
                              {currencyFormatter.format(segment.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              );

              return card.href ? (
                <Link
                  key={card.label}
                  className="rounded-[1.5rem] border border-black/[0.08] bg-white/75 p-5 shadow-[0_18px_45px_rgba(60,39,21,0.08)] transition hover:-translate-y-0.5 hover:border-[var(--forest)] hover:bg-white"
                  href={card.href}
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={card.label}
                  className="rounded-[1.5rem] border border-black/[0.08] bg-white/75 p-5 shadow-[0_18px_45px_rgba(60,39,21,0.08)]"
                >
                  {content}
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white/82 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Today</p>
              <h3 className="mt-3 text-2xl font-semibold">Today’s schedule</h3>
              <div className="mt-5 grid gap-3">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((item) => (
                    <div key={item.id} className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4">
                      <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.client} • {dateTime.format(new Date(item.startsAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-5">
                    <p className="text-sm text-[var(--muted)]">No events scheduled for today.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[1.75rem] bg-[linear-gradient(145deg,rgba(207,114,79,0.18),rgba(255,255,255,0.9))] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">What needs attention</p>
              <h3 className="mt-3 text-2xl font-semibold">Priority list</h3>
              <div className="mt-5 grid gap-3">
                {attentionItems.length > 0 ? (
                  attentionItems.map((item) => (
                    <Link
                      className="rounded-[1.1rem] border border-black/[0.08] bg-white/78 p-4 transition hover:border-[var(--forest)] hover:bg-white"
                      href={item.href}
                      key={item.label}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-[var(--ink)]">{item.label}</p>
                        <span className="rounded-full bg-[rgba(207,114,79,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                          {item.value}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white/78 p-5">
                    <p className="text-sm text-[var(--muted)]">Nothing urgent is waiting on you right now.</p>
                  </div>
                )}
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[1.75rem] bg-[linear-gradient(145deg,rgba(207,114,79,0.18),rgba(255,255,255,0.9))] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Unread messages
              </p>
              {unreadClientMessages.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {unreadClientMessages.slice(0, 4).map((message) => (
                    <Link
                      key={message.id}
                      className="rounded-[1.1rem] border border-black/[0.08] bg-white/78 p-4 transition hover:border-[var(--forest)] hover:bg-white"
                      href={`/projects/${message.projectId}?tab=activity`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{message.clientName || message.from}</p>
                          <p className="mt-1 text-sm font-medium text-[var(--ink)]">{message.subject}</p>
                        </div>
                        <span className="rounded-full bg-[rgba(207,114,79,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                          Unread
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                        {message.preview}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                        {dateTime.format(new Date(message.time))}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.1rem] border border-black/[0.08] bg-white/72 p-5">
                  <h3 className="text-2xl font-semibold leading-tight">No unread client emails.</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    When a client emails you back and it syncs into their project activity, it will show up here until you check it.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white/75 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                This week
              </p>
              <h3 className="mt-3 text-2xl font-semibold">Upcoming sessions</h3>
              <div className="mt-5 grid gap-4">
                {upcomingWeekSchedule.length > 0 ? (
                  upcomingWeekSchedule.map((item) => (
                    <div key={item.id} className="border-b border-black/[0.08] pb-4 last:border-b-0 last:pb-0">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.client} • {dateTime.format(new Date(item.startsAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-5">
                    <p className="text-sm text-[var(--muted)]">Nothing is scheduled this week yet.</p>
                  </div>
                )}
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white/80 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Inquiries</p>
                  <h3 className="mt-3 text-2xl font-semibold">New website inquiries</h3>
                </div>
                <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href="/leads">
                  Leads
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {recentInquiries.length > 0 ? (
                  recentInquiries.map((lead) => (
                    <Link
                      className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4 transition hover:border-[var(--forest)]"
                      href="/leads"
                      key={lead.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[var(--ink)]">{lead.name}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {lead.service} • {lead.source}
                          </p>
                        </div>
                        <span className="rounded-full bg-[rgba(207,114,79,0.12)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                          {lead.stageLabel}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Event date {dateTime.format(new Date(lead.eventDate))}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{lead.notes}</p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-5">
                    <p className="text-sm text-[var(--muted)]">No website inquiries have been submitted yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white/80 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Deliveries</p>
                  <h3 className="mt-3 text-2xl font-semibold">Pending deliveries</h3>
                </div>
                <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href="/projects">
                  Projects
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {pendingDeliveries.length > 0 ? (
                  pendingDeliveries.map((project) => (
                    <Link
                      className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4 transition hover:border-[var(--forest)]"
                      href={`/projects/${project.id}/deliverables`}
                      key={project.id}
                    >
                      <p className="font-semibold text-[var(--ink)]">{project.client}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{project.name}</p>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Shoot date {dateTime.format(new Date(project.projectDate))}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-5">
                    <p className="text-sm text-[var(--muted)]">No post-date projects are waiting on first deliverables.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white/80 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Gear</p>
                  <h3 className="mt-3 text-2xl font-semibold">Gear alerts</h3>
                </div>
                <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href="/crm">
                  Gear
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {gearAlerts.length > 0 ? (
                  gearAlerts.map((gear) => (
                    <Link
                      className="rounded-[1.1rem] border border-black/[0.08] bg-white p-4 transition hover:border-[var(--forest)]"
                      href="/crm"
                      key={`${gear.name}-${gear.current_holder}-${gear.due_back_at}`}
                    >
                      <p className="font-semibold text-[var(--ink)]">{gear.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{gear.current_holder || "Checked out"}</p>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        {gear.due_back_at ? `Due back ${dateTime.format(new Date(gear.due_back_at))}` : "No due-back date set"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-black/[0.08] bg-white p-5">
                    <p className="text-sm text-[var(--muted)]">No gear returns or project gear alerts in the next week.</p>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
