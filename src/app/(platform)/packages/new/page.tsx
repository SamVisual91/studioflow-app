import { DashboardShell } from "@/components/dashboard-shell";
import { PackageTemplateCanvasEditor } from "@/components/package-template-canvas-editor";
import { getDashboardPageData } from "@/lib/dashboard-page";

const packageCategories = [
  { value: "Wedding", label: "Weddings" },
  { value: "Business", label: "Business" },
  { value: "Others", label: "Others" },
];

export default async function NewPackageTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; presetId?: string; templateSetId?: string; saved?: string }>;
}) {
  const { user, data } = await getDashboardPageData();
  const query = await searchParams;
  const editablePreset = query.presetId
    ? data.packagePresets.find((item) => item.id === query.presetId)
    : query.templateSetId
      ? data.packagePresets.find((item) => item.templateSetId === query.templateSetId)
      : undefined;
  const initialCategory = editablePreset
    ? editablePreset.category
    : packageCategories.some((item) => item.value === query.category)
      ? String(query.category)
      : "Wedding";
  const templateSetPresets = editablePreset
    ? [...data.packagePresets]
        .filter((item) =>
          editablePreset.templateSetId
            ? item.templateSetId === editablePreset.templateSetId
            : item.id === editablePreset.id
        )
        .sort((left, right) => {
          const orderDelta = Number(left.templateSetOrder || 0) - Number(right.templateSetOrder || 0);
          if (orderDelta !== 0) {
            return orderDelta;
          }
          return Number(left.amount || 0) - Number(right.amount || 0);
        })
    : [];

  return (
    <DashboardShell
      currentPath="/packages"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">New Package Template</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-[3.25rem]">
            {editablePreset ? "Edit your package template" : "Build directly on the template"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Click the actual design to edit it. Banner, title, copy, sections, pricing, and line items all update right where they live.
          </p>
        </div>

        <PackageTemplateCanvasEditor
          initialCategory={initialCategory}
          initialHeroCoverImage={
            editablePreset?.templateSetCoverImage || editablePreset?.coverImage || ""
          }
          initialHeroCoverPosition={editablePreset?.templateSetCoverPosition || "50% 50%"}
          initialPackages={templateSetPresets.map((item, index) => ({
            amount: String(item.amount),
            coverPosition: item.coverPosition || "50% 50%",
            coverPreviewUrl: item.coverImage || "",
            description: item.description,
            id: item.id,
            name: item.name,
            sections: item.sections,
            subtitle: item.subtitle || (index === 0 ? "Primary Collection" : `Collection ${index + 1}`),
          }))}
          initialTemplateSetName={editablePreset?.templateSetName || editablePreset?.name}
          packageCategories={packageCategories}
          representativeId={editablePreset?.id}
          templateSetId={editablePreset?.templateSetId || ""}
        />
      </section>
    </DashboardShell>
  );
}
