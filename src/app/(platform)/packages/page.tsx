import Link from "next/link";
import {
  deletePackageTemplateSetAction,
  restoreDefaultPackagePresetsAction,
  updatePackageTemplateSetOrderAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { PackagesTemplateGrid } from "@/components/packages-template-grid";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { currencyFormatter } from "@/lib/formatters";

const packageCategories = [
  {
    value: "Wedding",
    label: "Weddings",
    description: "Keep your wedding collections organized and easy to reuse.",
    coverImage:
      "https://source.unsplash.com/1600x900/?wedding,couple,editorial,portrait",
  },
  {
    value: "Business",
    label: "Business",
    description: "Brand films, retainers, headshots, and launch-ready business work.",
    coverImage:
      "https://source.unsplash.com/1600x900/?business,brand,film,creative",
  },
  {
    value: "Others",
    label: "Others",
    description: "Creative sessions, music videos, events, and other custom work.",
    coverImage:
      "https://source.unsplash.com/1600x900/?creative,production,editorial,studio",
  },
] as const;

function buildPackagesHref(category: string) {
  const params = new URLSearchParams({ category });
  return `/packages?${params.toString()}`;
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    updated?: string;
    deleted?: string;
    restored?: string;
    error?: string;
    category?: string;
    preset?: string;
  }>;
}) {
  const { user, data } = await getDashboardPageData();
  const params = await searchParams;
  const showSaved = params.saved === "1";
  const showUpdated = params.updated === "1";
  const showDeleted = params.deleted === "1";
  const showRestored = params.restored === "1";
  const errorMessage =
    params.error === "preset-invalid"
      ? "Fill out all package fields before saving."
      : "";

  async function restorePackagePresetsFormAction() {
    "use server";
    await restoreDefaultPackagePresetsAction();
  }

  async function deleteTemplateSetFormAction(formData: FormData) {
    "use server";
    await deletePackageTemplateSetAction(formData);
  }

  async function reorderTemplateSetsFormAction(formData: FormData) {
    "use server";
    await updatePackageTemplateSetOrderAction(formData);
  }

  const activeCategory =
    packageCategories.find((category) => category.value === params.category) ?? packageCategories[0];
  const activeCategoryPresets = [...data.packagePresets]
    .filter((preset) => (preset.category || "Wedding") === activeCategory.value)
    .sort((left, right) => right.name.localeCompare(left.name));
  const activeTemplateSets = Array.from(
    activeCategoryPresets.reduce((groups, preset) => {
      const key = preset.templateSetId || preset.id;
      const current = groups.get(key) || [];
      current.push(preset);
      groups.set(key, current);
      return groups;
    }, new Map<string, typeof activeCategoryPresets>())
  )
    .map(([groupId, presets]) => {
      const sortedPresets = [...presets].sort((left, right) => {
        const orderDelta = Number(left.templateSetOrder || 0) - Number(right.templateSetOrder || 0);
        if (orderDelta !== 0) {
          return orderDelta;
        }
        return Number(left.amount || 0) - Number(right.amount || 0);
      });
      const representative = sortedPresets[0];
      return {
        groupId,
        representative,
        presets: sortedPresets,
        setName: representative.templateSetName || representative.name,
        templateSetId: representative.templateSetId || "",
        templateLibraryOrder: Number(representative.templateLibraryOrder ?? 0),
      };
    })
    .sort((left, right) => {
      const orderDelta = left.templateLibraryOrder - right.templateLibraryOrder;
      if (orderDelta !== 0) {
        return orderDelta;
      }
      return left.setName.localeCompare(right.setName);
    });

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
      <section className="grid gap-8">
        <SectionHeader
          eyebrow="Packages"
          title="Choose A Package Template"
          copy="Use this page as your package starting point. Pick the collection you want to work inside, then open it to shape the final package experience your clients will see."
        />

        {showSaved ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Package saved successfully.
          </div>
        ) : null}

        {showUpdated ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Package updated successfully.
          </div>
        ) : null}

        {showDeleted ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Package deleted successfully.
          </div>
        ) : null}

        {showRestored ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Default packages restored successfully.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-5 border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,242,0.94))] p-5 shadow-[0_18px_42px_rgba(59,36,17,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Filter</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {packageCategories.map((category) => {
                  const isActive = category.value === activeCategory.value;
                  const count = new Set(
                    data.packagePresets
                      .filter((preset) => (preset.category || "Wedding") === category.value)
                      .map((preset) => preset.templateSetId || preset.id)
                  ).size;

                  return (
                    <Link
                      key={category.value}
                      className={`px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-[rgba(15,23,42,0.08)] text-[var(--ink)] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]"
                          : "bg-[rgba(247,241,232,0.62)] text-[var(--ink)] hover:bg-[rgba(15,23,42,0.05)]"
                      }`}
                      href={buildPackagesHref(category.value)}
                    >
                      {category.label}
                      <span className="ml-2 text-[var(--muted)]">{count}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-10 min-h-10 w-10 min-w-10 items-center justify-center self-stretch bg-[var(--ink)] text-2xl leading-none text-white transition hover:brightness-110"
                href={`/packages/new?category=${encodeURIComponent(activeCategory.value)}`}
              >
                +
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center self-stretch bg-[var(--ink)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                href={`/packages/new?category=${encodeURIComponent(activeCategory.value)}`}
              >
                New template
              </Link>
              <div className="text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--ink)]">{activeTemplateSets.length}</span> saved package templates
              </div>
              <div className="text-sm text-[var(--muted)]">
                Sort by: <span className="font-medium text-[var(--ink)]">Name</span>
              </div>
              <form action={restorePackagePresetsFormAction}>
                <button className="border border-[rgba(47,125,92,0.22)] bg-white px-4 py-2 text-sm font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.08)]">
                  Restore defaults
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {activeTemplateSets.length === 0 ? (
            <div className="border border-dashed border-black/[0.12] bg-[rgba(247,241,232,0.42)] px-5 py-10 text-sm text-[var(--muted)]">
              No packages yet in {activeCategory.label}. Restore the defaults above or add package templates before building inside a collection.
            </div>
          ) : (
            <PackagesTemplateGrid
              activeCategory={activeCategory.value}
              deleteAction={deleteTemplateSetFormAction}
              items={activeTemplateSets.map((templateSet) => ({
                groupId: templateSet.groupId,
                previewImage:
                  templateSet.representative.templateSetCoverImage ||
                  templateSet.representative.coverImage ||
                  activeCategory.coverImage,
                previewImagePosition:
                  templateSet.representative.templateSetCoverPosition || "50% 50%",
                presetId: templateSet.representative.id,
                priceLabel: currencyFormatter.format(templateSet.representative.amount),
                representativeDescription: templateSet.representative.description || "",
                representativeTemplateSetId:
                  templateSet.templateSetId || templateSet.representative.templateSetId || "",
                setName: templateSet.setName,
                templateCount: templateSet.presets.length,
              }))}
              reorderAction={reorderTemplateSetsFormAction}
            />
          )}
        </section>
      </section>
    </DashboardShell>
  );
}
