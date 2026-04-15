import { getDashboardPageData } from "@/lib/dashboard-page";
import { getLedgerData } from "@/lib/ledger";

export const preciseCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export async function getLedgerPageData() {
  const [{ user, data }, ledger] = await Promise.all([
    getDashboardPageData(),
    Promise.resolve(getLedgerData()),
  ]);

  return {
    user,
    data,
    ledger,
    shellSummary: {
      weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
      tasksDue: data.stats.tasksDue,
      eventCount: data.schedule.length,
    },
  };
}
