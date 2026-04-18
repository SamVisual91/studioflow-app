import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { type UserRole } from "@/lib/roles";

const ledgerNav = [
  { href: "/ledger", label: "Overview" },
  { href: "/ledger/transactions", label: "Transactions" },
  { href: "/ledger/mileage", label: "Mileage" },
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
    role: UserRole;
    avatar_image?: string | null;
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

        <div className="grid gap-6">{children}</div>
      </section>
    </DashboardShell>
  );
}
