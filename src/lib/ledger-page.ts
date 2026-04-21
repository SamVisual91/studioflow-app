import { getDashboardPageData } from "@/lib/dashboard-page";
import { getLedgerData } from "@/lib/ledger";

export const preciseCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getWeekRange(referenceDate: Date) {
  const weekStart = new Date(referenceDate);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return { weekStart, weekEnd };
}

export async function getLedgerPageData() {
  const [{ user, data }, ledger] = await Promise.all([
    getDashboardPageData(),
    Promise.resolve(getLedgerData()),
  ]);
  const { weekStart, weekEnd } = getWeekRange(new Date());
  const weekStartTime = weekStart.getTime();
  const weekEndTime = weekEnd.getTime();

  const weeklyRevenue = ledger.entries.reduce((sum, entry) => {
    const transactionTime = new Date(entry.transactionDate).getTime();

    if (
      entry.direction !== "INCOME" ||
      !entry.invoiceId ||
      Number.isNaN(transactionTime) ||
      transactionTime < weekStartTime ||
      transactionTime >= weekEndTime
    ) {
      return sum;
    }

    return sum + Number(entry.amount || 0);
  }, 0);

  const tasksDue = data.projects.reduce((sum, project) => {
    if (project.archivedAt) {
      return sum;
    }

    return sum + (Array.isArray(project.tasks) ? project.tasks.length : 0);
  }, 0);

  const eventCount = data.schedule.reduce((sum, item) => {
    const startsAtTime = new Date(item.startsAt).getTime();
    if (Number.isNaN(startsAtTime) || startsAtTime < weekStartTime || startsAtTime >= weekEndTime) {
      return sum;
    }

    return sum + 1;
  }, 0);

  return {
    user,
    data,
    ledger,
    shellSummary: {
      weeklyRevenue,
      tasksDue,
      eventCount,
    },
  };
}
