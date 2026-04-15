import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export async function getDashboardPageData() {
  const [user, data] = await Promise.all([requireUser(), getDashboardData()]);
  return { user, data };
}
