import { notFound, redirect } from "next/navigation";
import { getDashboardPageData } from "@/lib/dashboard-page";

export default async function PackagePresetPage({
  params,
}: {
  params: Promise<{ presetId: string }>;
}) {
  const { data } = await getDashboardPageData();
  const route = await params;

  const preset = data.packagePresets.find((item) => item.id === route.presetId);

  if (!preset) {
    notFound();
  }

  const search = new URLSearchParams({
    category: preset.category || "Wedding",
    presetId: preset.id,
  });

  if (preset.templateSetId) {
    search.set("templateSetId", preset.templateSetId);
  }

  redirect(`/packages/new?${search.toString()}`);
}
