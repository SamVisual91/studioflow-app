import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";

const ledgerNav = [
  { href: "/ledger", label: "Overview" },
  { href: "/ledger/transactions", label: "Transactions" },
  { href: "/ledger/reconciliation", label: "Reconciliation" },
  { href: "/ledger/recurring", label: "Recurring" },
  { href: "/ledger/accounts-receivable", label: "Accounts receivable" },
  { href: "/ledger/reports", label: "Reports" },
] as const;

type LedgerWorkspaceProps = {
  currentPath: string;
  user: {
    name: string;
    email: string;
  };
  summary: {
    weeklyRevenue: number;
    tasksDue: number;
    eventCount: number;
  };
  title: string;
  copy: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function LedgerWorkspace({
  currentPath,
  user,
  summary,
  title,
  copy,
  children,
  actions,
}: LedgerWorkspaceProps) {
  return (
    <DashboardShell currentPath={currentPath} summary={summary} user={user}>
      <section className="grid gap-6">
        <div className="overflow-hidden rounded-[1.7rem] border border-black/[0.08] bg-[linear-gradient(135deg,#102134,#162b43_52%,#d8c2a4_100%)] p-5 text-white shadow-[0_20px_52px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[10px] uppercase tracking-[0.34em] text-white/66">Ledger workspace</p>
              <h1 className="mt-3 font-display text-3xl leading-none sm:text-[2.7rem]">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">{copy}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            {ledgerNav.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== "/ledger" && currentPath.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-[#10263d]"
                      : "border border-white/16 bg-white/8 text-white/86 hover:bg-white/14"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden">
          <SectionHeader eyebrow="Ledger" title={title} copy={copy} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <aside className="grid gap-4 xl:sticky xl:top-6">
            <div className="rounded-[1.4rem] border border-black/[0.08] bg-white/92 p-4 shadow-[0_16px_32px_rgba(59,36,17,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Books</p>
              <div className="mt-3 grid gap-2">
                {ledgerNav.map((item) => {
                  const isActive =
                    currentPath === item.href ||
                    (item.href !== "/ledger" && currentPath.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[rgba(16,33,52,0.08)] text-[#10263d]"
                          : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-black/[0.08] bg-white/92 p-4 shadow-[0_16px_32px_rgba(59,36,17,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Operating pulse</p>
              <div className="mt-3 grid gap-3">
                <div className="rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Weekly revenue</p>
                  <p className="mt-1 text-lg font-semibold">${summary.weeklyRevenue.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Tasks</p>
                    <p className="mt-1 text-lg font-semibold">{summary.tasksDue}</p>
                  </div>
                  <div className="rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Events</p>
                    <p className="mt-1 text-lg font-semibold">{summary.eventCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="grid gap-6">{children}</div>
        </div>
      </section>
    </DashboardShell>
  );
}
