import Link from "next/link";
import { logoutAction, openNotificationMessageAction } from "@/app/actions";
import { DoubleChevronDownIcon } from "@/components/double-chevron-down-icon";
import { getDb } from "@/lib/db";
import { currencyFormatter, dateTime } from "@/lib/formatters";

const navItems = [
  { href: "/overview", label: "Home" },
  { href: "/leads", label: "Leads" },
  { href: "/users", label: "Users" },
  { href: "/projects", label: "Projects" },
  { href: "/schedule", label: "Schedule" },
  { href: "/invoices", label: "Invoice" },
  {
    href: "/templates",
    label: "Templates",
    children: [
      { href: "/packages", label: "Packages" },
      { href: "/templates/contract", label: "Contracts" },
      { href: "/templates/invoice", label: "Invoice" },
      { href: "/templates/questionnaire", label: "Questionnaires" },
      { href: "/templates/services-guide", label: "Services guide" },
      { href: "/templates/timeline-planner", label: "Timeline planner" },
      { href: "/templates/shot-list", label: "Shot list" },
      { href: "/templates/mood-board", label: "Mood board" },
      { href: "/templates/welcome-guide", label: "Welcome guide" },
    ],
  },
  { href: "/crm", label: "Production" },
  { href: "/ledger", label: "Ledger" },
  { href: "/automations", label: "Automations" },
];

const quickActions = [
  {
    href: "/projects",
    label: "Make a project",
    copy: "Add a new client project from the Projects page.",
  },
  {
    href: "/projects",
    label: "Create a contact",
    copy: "Add a new client or contact from the Projects page.",
  },
  {
    href: "/projects",
    label: "Make an invoice",
    copy: "Open a project, then create an invoice from Files.",
  },
  {
    href: "/follow-ups",
    label: "Do a follow-up",
    copy: "Send a client follow-up from the queue.",
  },
];

type ShellProps = {
  currentPath: string;
  user: {
    name: string;
    email: string;
    avatar_image?: string | null;
  };
  summary: {
    weeklyRevenue: number;
    tasksDue: number;
    eventCount: number;
  };
  children: React.ReactNode;
};

function isNavItemActive(
  item: (typeof navItems)[number],
  currentPath: string
) {
  return (
    currentPath === item.href ||
    (item.href !== "/" && currentPath.startsWith(`${item.href}/`)) ||
    item.children?.some(
      (child) =>
        currentPath === child.href ||
        (child.href !== "/" && currentPath.startsWith(`${child.href}/`))
    )
  );
}

function NavigationLink({
  currentPath,
  item,
}: {
  currentPath: string;
  item: (typeof navItems)[number];
}) {
  const isActive = isNavItemActive(item, currentPath);

  if (item.children) {
    return (
      <details className="group" open={isActive}>
        <summary
          className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isActive ? "bg-white/12 text-white" : "text-white/78 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Link className="transition hover:text-white" href={item.href}>
            {item.label}
          </Link>
          <DoubleChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-white/55 transition group-open:rotate-180" />
        </summary>
        <div className="mt-1 grid gap-1 pl-5">
          {item.children.map((child) => {
            const isChildActive =
              currentPath === child.href ||
              (child.href !== "/" && currentPath.startsWith(`${child.href}/`));

            return (
              <Link
                key={child.href}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  isChildActive ? "text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                }`}
                href={child.href}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <Link
      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
        isActive ? "bg-white/12 text-white" : "text-white/78 hover:bg-white/8 hover:text-white"
      }`}
      href={item.href}
    >
      {item.label}
    </Link>
  );
}

function getUnreadClientNotifications() {
  const db = getDb();

  return db
    .prepare(
      "SELECT messages.id, messages.sender, messages.client_name, messages.project_id, messages.time, messages.subject, messages.preview, projects.name AS project_name FROM messages LEFT JOIN projects ON projects.id = messages.project_id WHERE messages.deleted_at IS NULL AND messages.unread = 1 AND LOWER(messages.direction) = 'inbound' AND LOWER(messages.channel) = 'email' ORDER BY messages.time DESC LIMIT 8"
    )
    .all() as Array<{
    id: string;
    sender: string;
    client_name: string | null;
    project_id: string | null;
    time: string;
    subject: string;
    preview: string;
    project_name: string | null;
  }>;
}

export function DashboardShell({ currentPath, user, summary, children }: ShellProps) {
  const notifications = getUnreadClientNotifications();
  const notificationCount = notifications.length;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]" data-app-shell>
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[var(--sidebar)] px-4 py-4 text-white sm:px-5 sm:py-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:px-6 lg:py-8">
          <div className="flex h-full flex-col justify-between gap-6 lg:gap-8">
            <div className="space-y-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#f2c27e,#cf724f)] text-sm font-extrabold tracking-[0.2em] text-[var(--sidebar)] sm:h-14 sm:w-14 sm:text-base">
                  SF
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 sm:text-xs sm:tracking-[0.28em]">
                    Client Ops Suite
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl">StudioFlow</h1>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">This week</p>
                <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  {currencyFormatter.format(summary.weeklyRevenue)}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {summary.tasksDue} tasks due and {summary.eventCount} client events on deck
                </p>
              </div>

              <nav className="hidden gap-2 lg:grid">
                {navItems.map((item) => (
                  <NavigationLink currentPath={currentPath} item={item} key={item.href} />
                ))}
              </nav>

              <details className="rounded-[1.35rem] border border-white/10 bg-white/5 lg:hidden">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">
                  Navigation
                </summary>
                <nav className="grid gap-2 border-t border-white/10 p-3">
                  {navItems.map((item) => (
                    <NavigationLink currentPath={currentPath} item={item} key={item.href} />
                  ))}
                </nav>
              </details>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full bg-[rgba(247,241,232,0.18)] bg-cover bg-center"
                    style={user.avatar_image ? { backgroundImage: `url(${user.avatar_image})` } : undefined}
                  >
                    {!user.avatar_image ? (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                        {user.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/60">Signed in</p>
                    <p className="mt-2 text-lg font-semibold text-white">{user.name}</p>
                  </div>
                </div>
                <p className="mt-2 break-words text-sm text-white/70">{user.email}</p>
              </div>
              <form action={logoutAction}>
                <button className="w-full rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <div className="mb-4 flex justify-end gap-3">
            <Link
              className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/88 px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_35px_rgba(59,36,17,0.08)] transition hover:border-[var(--forest)] hover:bg-[var(--forest)] hover:text-white"
              href="/"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10.5V20h14v-9.5" />
              </svg>
              <span>Website</span>
            </Link>
            <details className="group relative z-40">
              <summary
                aria-label="Open notifications"
                className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-black/[0.08] bg-white/88 text-[var(--ink)] shadow-[0_14px_35px_rgba(59,36,17,0.08)] transition hover:border-[var(--forest)] hover:bg-[var(--forest)] hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-[0.65rem] font-black leading-none text-white ring-2 ring-[var(--canvas)]">
                    {notificationCount}
                  </span>
                ) : null}
              </summary>
              <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(36,24,14,0.18)]">
                <div className="border-b border-black/[0.08] bg-[rgba(247,241,232,0.62)] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                    Notifications
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {notificationCount > 0
                      ? `${notificationCount} unread client message${notificationCount === 1 ? "" : "s"}`
                      : "No unread client emails"}
                  </p>
                </div>
                <div className="max-h-[26rem] overflow-y-auto p-2">
                  {notificationCount === 0 ? (
                    <div className="rounded-[1rem] px-3 py-4 text-sm leading-6 text-[var(--muted)]">
                      You are caught up. New client replies will appear here.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                        <form action={openNotificationMessageAction} key={notification.id}>
                          <input name="messageId" type="hidden" value={notification.id} />
                          <input name="projectId" type="hidden" value={notification.project_id || ""} />
                          <button className="block w-full rounded-[1rem] px-3 py-3 text-left transition hover:bg-[rgba(47,125,92,0.08)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                                {notification.subject || "Client reply"}
                              </p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {notification.client_name || notification.sender}
                                {notification.project_name ? ` - ${notification.project_name}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[rgba(207,114,79,0.12)] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                              New
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                            {notification.preview}
                          </p>
                          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                            {dateTime.format(new Date(notification.time))}
                          </p>
                          </button>
                        </form>
                    ))
                  )}
                </div>
              </div>
            </details>
            <details className="group relative z-30">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-black/[0.08] bg-white/88 px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_35px_rgba(59,36,17,0.08)] transition hover:border-[var(--forest)] hover:bg-[var(--forest)] hover:text-white">
                <span className="text-lg leading-none">+</span>
                <span>New</span>
              </summary>
              <div className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(36,24,14,0.18)]">
                <div className="border-b border-black/[0.08] bg-[rgba(247,241,232,0.62)] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                    Shortcut
                  </p>
                  <p className="mt-1 text-sm font-semibold">What do you want to make?</p>
                </div>
                <div className="grid gap-1 p-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      className="rounded-[1rem] px-3 py-3 transition hover:bg-[rgba(47,125,92,0.08)]"
                      href={action.href}
                    >
                      <p className="text-sm font-semibold text-[var(--ink)]">{action.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{action.copy}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
